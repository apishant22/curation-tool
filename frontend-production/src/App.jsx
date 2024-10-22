import { useState } from "react";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import Header from "./components/Header";
import blueCurve from "./assets/blue.jpg";
import HeaderContent from "./components/HeaderContent";
import Content from "./components/Content";
import Footer from "./components/Footer";




const App = () => {
  const [results, setResults] = useState([]);

  return (
    <div
      className="flex flex-col h-screen overflow-y-auto"
      style={{
        // backgroundImage: `url(${blueCurve})`,
        // backgroundSize: "cover",
        // backgroundPosition: "center",
      }}
    >

      <Header />
      {/* <div className="flex-1 flex justify-center items-center">
        <div className="h-[450px] flex flex-col items-center justify-start">
          <SearchBar setResults={setResults} />
          <SearchResults results={results} />
        </div>
      </div> */}
      <HeaderContent/>
      <Content/>
      <Footer/>

    </div>
  );
};

export default App;