import HeroSection from '@/components/HeroSection'
import WhatWeDo from '@/components/WhatWeDo'
import WhyChoose from '@/components/WhyChoose'
import FreeConsultation from '@/components/FreeConsultation'
import WhoIsThisFor from '@/components/WhoIsThisFor'
import Products from '@/components/Products'
import CustomizationProcess from '@/components/CustomizationProcess'
import CallToAction from '@/components/CallToAction'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <WhatWeDo />
      <WhyChoose />
      <FreeConsultation />
      <WhoIsThisFor />
      <Products />
      <CustomizationProcess />
      <CallToAction />
      <Footer />
      <WhatsAppFloat />
    </main>
  )
}

