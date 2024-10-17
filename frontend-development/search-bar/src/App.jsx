import { useState } from "react";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import Header from "./components/Header";
import blueCurve from "./assets/blue.jpg";

const App = () => {
  const [results, setResults] = useState([]);

  return (
    <div
      className="flex flex-col min-h-screen overflow-hidden"
      style={{
        backgroundImage: `url(${blueCurve})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Header />
      <div className="flex-1 flex justify-center items-center">
        <div className="h-[450px] flex flex-col items-center justify-start">
          <h1 className="text-center mb-6">ACM-W Curation Tool</h1>
          <SearchBar setResults={setResults} />
          <SearchResults results={results} />
        </div>
      </div>
    </div>
  );
};

export default App;