import React from 'react'
import { Navbarsection } from '../Navbar'
import HeroSection from '../HeroSection'
import About from '../About'
import WhatWeOffer from '../Whatweoffer'
import WhyAlphaR from '../Whyalpha'
import Footer from '../Footer'
import Plans from '../Plans'
import Testimonial from '../Testimonial'
import Blog from '../Blog'

const Mainsection = () => {
  return (
    <div>
        <Navbarsection/>
        <HeroSection/>
        <Plans/>
        <About/>
        <WhatWeOffer/>
        <Testimonial />
        <WhyAlphaR/>
        <Blog />
        <Footer/>
    </div>
  )
}

export default Mainsection