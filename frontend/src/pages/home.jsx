import React from "react";
import Hero from "../components/auction/hero";
import CategoryGrid from "../components/auction/CategoryGrid";
import FeaturedLots from "../components/auction/FeaturedLots";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedLots />
    </>
  );
}