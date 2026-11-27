import { useFolio } from "../state/FolioContext";
import BookForm from "./forms/BookForm";
import CollectionChooserForm from "./forms/CollectionChooserForm";
import ExistingSeriesForm from "./forms/ExistingSeriesForm";
import CollectionForm from "./forms/CollectionForm";
import UniverseForm from "./forms/UniverseForm";
import SeriesForm from "./forms/SeriesForm";
import PreorderForm from "./forms/PreorderForm";
import SubscriptionForm from "./forms/SubscriptionForm";
import MonthlyBookForm from "./forms/MonthlyBookForm";

// The add/edit form shown in the app's bottom sheet, chosen by `modal`.
export default function FormModal() {
  const { modal } = useFolio();
  switch (modal) {
    case "book":
      return <BookForm />;
    case "collectionChooser":
      return <CollectionChooserForm />;
    case "existingSeries":
      return <ExistingSeriesForm />;
    case "collection":
      return <CollectionForm />;
    case "universe":
      return <UniverseForm />;
    case "series":
      return <SeriesForm />;
    case "preorder":
      return <PreorderForm />;
    case "subscription":
      return <SubscriptionForm />;
    case "monthlyBook":
      return <MonthlyBookForm />;
    default:
      return null;
  }
}
