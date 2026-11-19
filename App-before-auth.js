import React, { useMemo, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal, ScrollView,
  Image, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from './src/supabase';
const C = {
  bg: "#F7F6F1", card: "#FFFFFF", ink: "#292D29", muted: "#777D75",
  sage: "#82917C", pale: "#E8EDE5", line: "#E8E7E0", white: "#FFFFFF",
};
const money = n => new Intl.NumberFormat("en-GB", { style:"currency", currency:"GBP" }).format(Number(n)||0);

function Action({ title, onPress, primary=false, small=false, disabled=false }) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} style={{
    backgroundColor: primary ? C.sage : C.pale, paddingVertical:small?8:12,
    paddingHorizontal:small?12:16, borderRadius:18, alignItems:"center", opacity: disabled ? 0.5 : 1
  }}><Text style={{color:primary?C.white:C.ink,fontWeight:"600",fontSize:small?12:14}}>{title}</Text></TouchableOpacity>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return <View style={{marginBottom:12}}>
    <Text style={{color:C.muted,fontSize:12,marginBottom:6}}>{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder||label}
      placeholderTextColor="#A6AAA2" keyboardType={keyboardType}
      style={{backgroundColor:C.bg,borderRadius:12,padding:12,color:C.ink,borderWidth:1,borderColor:C.line}} />
  </View>;
}
function Choice({ label, value, options, onChange }) {
  return <View style={{marginBottom:14}}>
    <Text style={{color:C.muted,fontSize:12,marginBottom:7}}>{label}</Text>
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:7}}>
      {options.map(o=><TouchableOpacity key={o} onPress={()=>onChange(o)} style={{
        paddingVertical:8,paddingHorizontal:12,borderRadius:15,backgroundColor:value===o?C.sage:C.bg
      }}><Text style={{color:value===o?C.white:C.ink,fontSize:12,fontWeight:"600"}}>{o}</Text></TouchableOpacity>)}
    </View>
  </View>;
}
function Cover({ uri, title, style }) {
  return uri ? <Image source={{uri}} style={[{width:64,height:92,borderRadius:8,backgroundColor:C.pale},style]} /> :
    <View style={[{width:64,height:92,borderRadius:8,backgroundColor:C.pale,alignItems:"center",justifyContent:"center",padding:5},style]}>
      <Text style={{color:C.sage,fontSize:19}}>📖</Text>
      {!!title && <Text numberOfLines={3} style={{color:C.sage,fontSize:8,textAlign:"center",marginTop:4}}>{title}</Text>}
    </View>;
}

  export default function App() {
      const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [tab,setTab]=useState("Library");
    const [books,setBooks]=useState([
      {id:"sample1",title:"The Very Secret Society of Irregular Witches",author:"Sangu Mandanna",format:"Hardback",edition:"Special",tbr:true,cover:null,photos:[],genre:"Fantasy"},
      {id:"sample2",title:"A Study in Drowning",author:"Ava Reid",format:"Paperback",edition:"Standard",tbr:false,cover:null,photos:[],genre:"Fantasy"},
    ]);
    const [preorders,setPreorders]=useState([]);
    const [modal,setModal]=useState("");
    const [search,setSearch]=useState("");
    const [bookForm,setBookForm]=useState({});
    const [preForm,setPreForm]=useState({});
    const [lookupBusy,setLookupBusy]=useState(false);
    const [lookupMessage,setLookupMessage]=useState("");
          const totalSpend=useMemo(()=>preorders.reduce((s,p)=>s+(Number(p.cost)||0),0),[preorders]);
      const setBF=(k,v)=>setBookForm(p=>({...p,[k]:v}));
const setPF=(k,v)=>setPreForm(p=>({...p,[k]:v}));
  async function choosePhoto(target,multiple=false) {
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted){Alert.alert("Permission needed","Please allow photo library access to choose photos.");return;}
    const result=await ImagePicker.launchImageLibraryAsync({
      mediaTypes:["images"],allowsEditing:!multiple,allowsMultipleSelection:multiple,
      selectionLimit:multiple?8:1,quality:0.85
    });
    if(result.canceled||!result.assets?.length)return;
    if(target==="cover")setBF("cover",result.assets[0].uri);
    if(target==="photos")setBF("photos",result.assets.map(a=>a.uri));
  }
  async function lookupBook() {
    const q=(bookForm.isbn||"").trim()?`isbn:${bookForm.isbn.trim()}`:(bookForm.title||"").trim();
    if(!q){Alert.alert("Enter a title or ISBN","Add a title or ISBN first, then try the search.");return;}
    setLookupBusy(true);setLookupMessage("");
    try{
      const url="https://www.googleapis.com/books/v1/volumes?q="+encodeURIComponent(q)+"&maxResults=1";
      const response=await fetch(url);
      if(!response.ok)throw new Error("Search unavailable");
      const data=await response.json();
      const info=data.items?.[0]?.volumeInfo;
      if(!info){setLookupMessage("No match found. You can enter the details and add your own cover.");return;}
      const image=info.imageLinks?.thumbnail||info.imageLinks?.smallThumbnail||null;
      setBookForm(p=>({...p,title:p.title||info.title||"",author:p.author||((info.authors||[]).join(", ")),cover:p.cover||image,description:info.description||p.description||""}));
      setLookupMessage("Book details found. Check them before saving.");
    }catch(e){setLookupMessage("Couldn't reach the book search just now. You can still add the book manually.");}
    finally{setLookupBusy(false);}
  }
  function openBook(){setBookForm({title:"",author:"",isbn:"",format:"Hardback",edition:"Standard",tbr:true,cover:null,photos:[],genre:""});setLookupMessage("");setModal("book");}
  function saveBook(){
    if(!bookForm.title?.trim()){Alert.alert("Add a title","Please enter the book title.");return;}
    setBooks(p=>[{...bookForm,id:String(Date.now())},...p]);setModal("");
  }
  function openPreorder(){setPreForm({title:"",author:"",format:"Hardback",edition:"Standard",retailer:"",cost:"",status:"Ordered",orderDate:"",releaseDate:""});setModal("preorder");}
  function savePreorder(){
    if(!preForm.title?.trim()){Alert.alert("Add a title","Please enter the book title.");return;}
    if(preForm.cost&&(!Number.isFinite(Number(preForm.cost))||Number(preForm.cost)<0)){Alert.alert("Check the cost","Please enter a valid amount.");return;}
    setPreorders(p=>[{...preForm,id:String(Date.now())},...p]);setModal("");
  }
  function receivePreorder(item){
    setPreorders(p=>p.filter(x=>x.id!==item.id));
    setBooks(p=>[{id:String(Date.now()),title:item.title,author:item.author,format:item.format,edition:item.edition,tbr:false,cover:null,photos:[],genre:""},...p]);
    Alert.alert("Added to My Library",`${item.title} has been moved into your library. You can add its cover there.`);
  }
  function advanceStatus(item){
    if(item.status==="Ordered")setPreorders(p=>p.map(x=>x.id===item.id?{...x,status:"Shipped"}:x));
    else receivePreorder(item);
  }
  const filtered=books.filter(b=>(tab!=="TBR"||b.tbr)&&(b.title+" "+b.author+" "+(b.genre||"")).toLowerCase().includes(search.toLowerCase()));
  const tabs=["Library","TBR","Pre-orders","Collection"];

  return <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
    <View style={{flex:1}}>
      <View style={{paddingHorizontal:20,paddingTop:8,paddingBottom:14}}>
        <Text style={{fontSize:30,letterSpacing:1.5,color:C.ink,fontWeight:"700"}}>folio</Text>
        <Text style={{color:C.muted,marginTop:3}}>Your books, beautifully organised.</Text>
      </View>
      <View style={{flexDirection:"row",marginHorizontal:12,backgroundColor:"#EFEEE8",padding:4,borderRadius:18}}>
        {tabs.map(t=><TouchableOpacity key={t} onPress={()=>{setTab(t);setSearch("");}} style={{
          flex:1,paddingVertical:10,borderRadius:14,alignItems:"center",backgroundColor:tab===t?C.white:"transparent"
        }}><Text style={{fontSize:10.5,fontWeight:tab===t?"700":"500",color:tab===t?C.ink:C.muted}}>{t}</Text></TouchableOpacity>)}
      </View>

      {tab==="Collection"?<ScrollView contentContainerStyle={{padding:20}}>
        <Text style={{fontSize:23,color:C.ink,fontWeight:"700",marginBottom:16}}>Your collection</Text>
        <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>
          {[["Unique titles",books.length],["On your TBR",books.filter(b=>b.tbr).length],["Pre-orders",preorders.length],["Pre-order spend",money(totalSpend)],["Special editions",books.filter(b=>["Special","Limited","Signed","First edition"].includes(b.edition)).length],["Hardbacks",books.filter(b=>b.format==="Hardback").length]].map(([label,value])=>
            <View key={label} style={{width:"47%",backgroundColor:C.card,borderRadius:18,padding:16}}>
              <Text style={{color:C.muted,fontSize:12}}>{label}</Text><Text style={{color:C.ink,fontSize:21,fontWeight:"700",marginTop:8}}>{value}</Text>
            </View>)}
        </View>
      </ScrollView>:tab==="Pre-orders"?<View style={{flex:1}}>
        <ScrollView contentContainerStyle={{padding:18,paddingBottom:100}}>
          <Text style={{fontSize:23,color:C.ink,fontWeight:"700"}}>Pre-orders</Text>
          <Text style={{color:C.muted,marginTop:4,marginBottom:14}}>Remember what you've ordered and what it cost.</Text>
          <View style={{backgroundColor:C.pale,borderRadius:18,padding:17,marginBottom:16}}>
            <Text style={{color:C.muted,fontSize:12}}>TOTAL PRE-ORDER SPEND</Text>
            <Text style={{color:C.ink,fontSize:29,fontWeight:"700",marginTop:5}}>{money(totalSpend)}</Text>
            <Text style={{color:C.muted,fontSize:12,marginTop:4}}>{preorders.length} {preorders.length===1?"book":"books"} currently on order</Text>
          </View>
          {preorders.length===0?<View style={{alignItems:"center",padding:30}}>
            <Text style={{fontSize:38}}>📦</Text><Text style={{color:C.ink,fontWeight:"700",fontSize:17,marginTop:10}}>No pre-orders yet</Text>
            <Text style={{color:C.muted,textAlign:"center",marginTop:6}}>Add a book when you order it. Your spending total will update automatically.</Text>
          </View>:preorders.map(item=><View key={item.id} style={{backgroundColor:C.card,borderRadius:18,padding:15,marginBottom:11}}>
            <View style={{flexDirection:"row",justifyContent:"space-between",gap:10}}>
              <View style={{flex:1}}>
                <Text style={{color:C.ink,fontWeight:"700",fontSize:15}}>{item.title}</Text>
                <Text style={{color:C.muted,fontSize:12,marginTop:3}}>{item.author}</Text>
                <Text style={{color:C.muted,fontSize:11,marginTop:7}}>{item.format} · {item.edition} edition</Text>
                {!!item.retailer&&<Text style={{color:C.muted,fontSize:11,marginTop:3}}>Retailer: {item.retailer}</Text>}
                {!!item.releaseDate&&<Text style={{color:C.muted,fontSize:11,marginTop:3}}>Expected release: {item.releaseDate}</Text>}
              </View>
              <View style={{alignItems:"flex-end"}}>
                <Text style={{color:C.ink,fontWeight:"700",fontSize:16}}>{money(item.cost)}</Text>
                <Text style={{color:C.sage,fontSize:11,fontWeight:"700",marginTop:6}}>{item.status}</Text>
              </View>
            </View>
            <View style={{flexDirection:"row",gap:8,marginTop:12,flexWrap:"wrap"}}>
              <Action title={item.status==="Ordered"?"Mark shipped":"Mark received"} small onPress={()=>advanceStatus(item)}/>
              <Action title="Remove" small onPress={()=>Alert.alert("Remove pre-order?","This removes it from your preorder list.",[{text:"Cancel",style:"cancel"},{text:"Remove",style:"destructive",onPress:()=>setPreorders(p=>p.filter(x=>x.id!==item.id))}])}/>
            </View>
          </View>)}
        </ScrollView>
        <View style={{position:"absolute",bottom:14,right:18}}><Action title="+ Add pre-order" primary onPress={openPreorder}/></View>
      </View>:<View style={{flex:1}}>
        <View style={{paddingHorizontal:18,paddingTop:16}}>
          <Text style={{fontSize:23,color:C.ink,fontWeight:"700"}}>{tab==="TBR"?"My TBR":"My Library"}</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search title, author or genre" placeholderTextColor="#A6AAA2"
            style={{backgroundColor:C.card,borderRadius:14,padding:12,marginTop:12,marginBottom:10,color:C.ink}}/>
        </View>
        <FlatList data={filtered} keyExtractor={x=>x.id} contentContainerStyle={{paddingHorizontal:18,paddingBottom:100}}
          ListEmptyComponent={<Text style={{color:C.muted,textAlign:"center",marginTop:30}}>No books found.</Text>}
          renderItem={({item})=><View style={{backgroundColor:C.card,borderRadius:17,padding:12,marginBottom:10,flexDirection:"row",gap:12}}>
            <Cover uri={item.cover} title={item.title}/>
            <View style={{flex:1,justifyContent:"center"}}>
              <Text style={{color:C.ink,fontWeight:"700"}}>{item.title}</Text>
              <Text style={{color:C.muted,fontSize:12,marginTop:3}}>{item.author}</Text>
              <Text style={{color:C.muted,fontSize:11,marginTop:5}}>{item.format} · {item.edition} edition{item.genre?` · ${item.genre}`:""}</Text>
              {!!item.photos?.length&&<Text style={{color:C.sage,fontSize:10,marginTop:4}}>{item.photos.length} edition photo(s)</Text>}
              <View style={{alignSelf:"flex-start",marginTop:8}}><Action title={item.tbr?"On My TBR ✓":"Add to My TBR"} small onPress={()=>setBooks(p=>p.map(b=>b.id===item.id?{...b,tbr:!b.tbr}:b))}/></View>
            </View>
          </View>}/>
        <View style={{position:"absolute",bottom:14,left:0,right:0,alignItems:"center"}}>
          <TouchableOpacity onPress={openBook} style={{backgroundColor:C.sage,width:58,height:58,borderRadius:29,alignItems:"center",justifyContent:"center",elevation:4}}>
            <Text style={{color:C.white,fontSize:32,lineHeight:36}}>+</Text>
          </TouchableOpacity>
          <Text style={{fontSize:10,color:C.muted,marginTop:3}}>Add book</Text>
        </View>
      </View>}
    </View>

    <Modal visible={!!modal} animationType="slide" transparent onRequestClose={()=>setModal("")}>
      <View style={{flex:1,backgroundColor:"#0006",justifyContent:"flex-end"}}>
        <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":undefined}>
          <View style={{backgroundColor:C.white,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:"94%"}}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{fontSize:22,fontWeight:"700",color:C.ink,marginBottom:16}}>{modal==="preorder"?"Add a pre-order":"Add a book to your library"}</Text>
              {modal==="preorder"?<>
                <Field label="Book title" value={preForm.title||""} onChangeText={v=>setPF("title",v)}/>
                <Field label="Author" value={preForm.author||""} onChangeText={v=>setPF("author",v)}/>
                <Choice label="Format" value={preForm.format||"Hardback"} options={["Paperback","Hardback","Audiobook"]} onChange={v=>setPF("format",v)}/>
                <Choice label="Edition" value={preForm.edition||"Standard"} options={["Standard","Special"]} onChange={v=>setPF("edition",v)}/>
                <Field label="Retailer / bookshop" value={preForm.retailer||""} onChangeText={v=>setPF("retailer",v)} placeholder="e.g. Waterstones"/>
                <Field label="Cost (£)" value={preForm.cost||""} onChangeText={v=>setPF("cost",v)} placeholder="e.g. 24.99" keyboardType="decimal-pad"/>
                <Field label="Expected release date (optional)" value={preForm.releaseDate||""} onChangeText={v=>setPF("releaseDate",v)} placeholder="e.g. 12/03/2027"/>
                <Choice label="Order status" value={preForm.status||"Ordered"} options={["Ordered","Shipped"]} onChange={v=>setPF("status",v)}/>
                <Text style={{color:C.muted,fontSize:11,marginBottom:14}}>No cover photo needed — you can add one to My Library when the book arrives.</Text>
                <Action title="Save pre-order" primary onPress={savePreorder}/>
              </>:<>
                <Field label="Book title" value={bookForm.title||""} onChangeText={v=>setBF("title",v)}/>
                <Field label="Author" value={bookForm.author||""} onChangeText={v=>setBF("author",v)}/>
                <Field label="ISBN (optional)" value={bookForm.isbn||""} onChangeText={v=>setBF("isbn",v)} keyboardType="numeric"/>
                <Action title={lookupBusy?"Searching…":"Find book details and cover"} onPress={lookupBook} disabled={lookupBusy}/>
                {!!lookupMessage&&<Text style={{color:C.sage,fontSize:12,marginTop:8,marginBottom:8}}>{lookupMessage}</Text>}
                <Choice label="Format" value={bookForm.format||"Hardback"} options={["Paperback","Hardback","Audiobook","Ebook"]} onChange={v=>setBF("format",v)}/>
                <Choice label="Edition" value={bookForm.edition||"Standard"} options={["Standard","Special","Limited","Signed","First edition"]} onChange={v=>setBF("edition",v)}/>
                <Field label="Genre (optional)" value={bookForm.genre||""} onChangeText={v=>setBF("genre",v)} placeholder="e.g. Fantasy, Romance"/>
                <Choice label="Add to My TBR?" value={bookForm.tbr?"Yes":"No"} options={["Yes","No"]} onChange={v=>setBF("tbr",v==="Yes")}/>
                <Action title={bookForm.cover?"Change cover photo":"Upload cover photo"} onPress={()=>choosePhoto("cover")}/>
                {bookForm.cover?<Image source={{uri:bookForm.cover}} style={{width:84,height:120,borderRadius:9,marginTop:10}}/>:null}
                <View style={{height:14}}/>
                <Action title="Add photos of this edition (edges, spine, endpapers)" onPress={()=>choosePhoto("photos",true)}/>
                {!!bookForm.photos?.length&&<Text style={{color:C.sage,fontSize:12,marginTop:7}}>{bookForm.photos.length} edition photo(s) selected</Text>}
                <View style={{height:16}}/><Action title="Save book" primary onPress={saveBook}/>
              </>}
              <View style={{height:10}}/><Action title="Cancel" onPress={()=>setModal("")}/>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  </SafeAreaView>;
}
