import { Text } from "react-native";

import styles from "../../styles";
import { AppButton, Field } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

export default function MonthlyBookForm() {
  const {
    addMonthlyBook,
    monthlyBookForm,
    setMonthlyBookForm,
  } = useFolio();
    return (
      <>
        <Text style={styles.modalTitle}>Add monthly book</Text>
        <Field
          label="Book title"
          value={monthlyBookForm.title}
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, title: v }))}
        />
        <Field
          label="Author"
          value={monthlyBookForm.author}
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, author: v }))}
        />
        <Field
          label="Edition name"
          value={monthlyBookForm.edition_name}
          onChangeText={v =>
            setMonthlyBookForm(p => ({ ...p, edition_name: v }))
          }
        />
        <Field
          label="Cover URL"
          value={monthlyBookForm.cover_url}
          onChangeText={v =>
            setMonthlyBookForm(p => ({ ...p, cover_url: v }))
          }
        />
        <Field
          label="Month (1–12)"
          value={monthlyBookForm.month}
          keyboardType="numeric"
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, month: v }))}
        />
        <Field
          label="Year"
          value={monthlyBookForm.year}
          keyboardType="numeric"
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, year: v }))}
        />
        <AppButton label="Add monthly book" onPress={addMonthlyBook} />
      </>
    );
}
