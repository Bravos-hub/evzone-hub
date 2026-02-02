import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

export function EVChargingAnimation() {
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    fetch('/assets/ev-charging.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => {
        console.error('Error loading Lottie animation:', error)
      })
  }, [])

  if (!animationData) {
    return (
      <div className="w-full max-w-[400px] h-[300px] mx-auto flex items-center justify-center">
        <TextSkeleton lines={2} centered />
      </div>
    )
  }

  return (
    <div className="w-full max-w-[400px] h-[300px] mx-auto flex items-center justify-center">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        className="w-full h-full"
      />
    </div>
  )
}

