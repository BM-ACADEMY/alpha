import React from 'react'
import { Navbarsection } from '../Navbar'
import HeroSection from '../HeroSection'
import About from '../About'
import WhatWeOffer from '../Whatweoffer'
import WhyAlphaR from '../Whyalpha'
import Footer from '../Footer'

const Mainsection = () => {
  return (
    <div>
        <Navbarsection/>
        <HeroSection/>
        <About/>
        <WhatWeOffer/>
        <WhyAlphaR/>
        <Footer/>
    </div>
  )
}

export default Mainsection