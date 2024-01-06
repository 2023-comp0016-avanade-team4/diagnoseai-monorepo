'use client'

import 'keen-slider/keen-slider.min.css'
import { useKeenSlider } from 'keen-slider/react'
import { Image } from '@nextui-org/react'
import { useEffect } from 'react'

const ImageCarousel = ({ images, height, width }: { images: string[], height: number, width: number }) => {
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: false,
    mode: "snap",
    rtl: false,
    slides: { perView: "auto", spacing: 15 },
  })

  useEffect(() => {
    instanceRef?.current?.update()
  }, [instanceRef, width])

  return (
    <div ref={sliderRef} className="keen-slider absolute p-3" style={{
      width: width,
    }}>
      {images.map((image) => (
        <div className="keen-slider__slide" key={image}>
          <Image src={image} alt="an image" loading="lazy" style={{
            objectFit: 'scale-down',
            width: 'auto',
            height: height,
          }} />
        </div>
      ))}
    </div>
  )
}

// TODO: Lightbox

export default ImageCarousel
