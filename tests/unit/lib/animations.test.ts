import {
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideInFromBottom,
  staggerContainer,
  staggerItem,
  hoverScale,
  hoverRotate,
  hoverLift,
  spinAnimation,
  pulseAnimation,
  pageTransition,
  modalAnimation,
  dropdownAnimation,
  tooltipAnimation,
  tableRowAnimation,
  cardAnimation,
  buttonAnimation,
  iconAnimation
} from '@/lib/animations'

describe('Animation Variants', () => {
  describe('Basic fade animations', () => {
    it('should have correct fadeInUp structure', () => {
      expect(fadeInUp).toHaveProperty('initial')
      expect(fadeInUp).toHaveProperty('animate')
      expect(fadeInUp).toHaveProperty('exit')
      expect(fadeInUp.initial).toEqual({ opacity: 0, y: 20 })
      expect(fadeInUp.animate).toEqual({ opacity: 1, y: 0 })
      expect(fadeInUp.exit).toEqual({ opacity: 0, y: -20 })
    })

    it('should have correct fadeInDown structure', () => {
      expect(fadeInDown).toHaveProperty('initial')
      expect(fadeInDown).toHaveProperty('animate')
      expect(fadeInDown).toHaveProperty('exit')
      expect(fadeInDown.initial).toEqual({ opacity: 0, y: -20 })
      expect(fadeInDown.animate).toEqual({ opacity: 1, y: 0 })
      expect(fadeInDown.exit).toEqual({ opacity: 0, y: 20 })
    })

    it('should have correct fadeInLeft structure', () => {
      expect(fadeInLeft).toHaveProperty('initial')
      expect(fadeInLeft).toHaveProperty('animate')
      expect(fadeInLeft).toHaveProperty('exit')
      expect(fadeInLeft.initial).toEqual({ opacity: 0, x: -20 })
      expect(fadeInLeft.animate).toEqual({ opacity: 1, x: 0 })
      expect(fadeInLeft.exit).toEqual({ opacity: 0, x: 20 })
    })

    it('should have correct fadeInRight structure', () => {
      expect(fadeInRight).toHaveProperty('initial')
      expect(fadeInRight).toHaveProperty('animate')
      expect(fadeInRight).toHaveProperty('exit')
      expect(fadeInRight.initial).toEqual({ opacity: 0, x: 20 })
      expect(fadeInRight.animate).toEqual({ opacity: 1, x: 0 })
      expect(fadeInRight.exit).toEqual({ opacity: 0, x: -20 })
    })
  })

  describe('Scale animations', () => {
    it('should have correct scaleIn structure', () => {
      expect(scaleIn).toHaveProperty('initial')
      expect(scaleIn).toHaveProperty('animate')
      expect(scaleIn).toHaveProperty('exit')
      expect(scaleIn.initial).toEqual({ opacity: 0, scale: 0.8 })
      expect(scaleIn.animate).toEqual({ opacity: 1, scale: 1 })
      expect(scaleIn.exit).toEqual({ opacity: 0, scale: 0.8 })
    })

    it('should have correct slideInFromBottom structure', () => {
      expect(slideInFromBottom).toHaveProperty('initial')
      expect(slideInFromBottom).toHaveProperty('animate')
      expect(slideInFromBottom).toHaveProperty('exit')
      expect(slideInFromBottom.initial).toEqual({ opacity: 0, y: 100 })
      expect(slideInFromBottom.animate).toEqual({ opacity: 1, y: 0 })
      expect(slideInFromBottom.exit).toEqual({ opacity: 0, y: 100 })
    })
  })

  describe('Stagger animations', () => {
    it('should have correct staggerContainer structure', () => {
      expect(staggerContainer).toHaveProperty('animate')
      expect(staggerContainer.animate).toHaveProperty('transition')
      expect(staggerContainer.animate.transition).toHaveProperty('staggerChildren', 0.1)
    })

    it('should have correct staggerItem structure', () => {
      expect(staggerItem).toHaveProperty('initial')
      expect(staggerItem).toHaveProperty('animate')
      expect(staggerItem.initial).toEqual({ opacity: 0, y: 20 })
      expect(staggerItem.animate).toEqual({ opacity: 1, y: 0 })
    })
  })

  describe('Hover animations', () => {
    it('should have correct hoverScale structure', () => {
      expect(hoverScale).toHaveProperty('whileHover')
      expect(hoverScale).toHaveProperty('whileTap')
      expect(hoverScale.whileHover).toEqual({ scale: 1.05 })
      expect(hoverScale.whileTap).toEqual({ scale: 0.95 })
    })

    it('should have correct hoverRotate structure', () => {
      expect(hoverRotate).toHaveProperty('whileHover')
      expect(hoverRotate).toHaveProperty('transition')
      expect(hoverRotate.whileHover).toEqual({ rotate: 5 })
      expect(hoverRotate.transition).toEqual({ duration: 0.2 })
    })

    it('should have correct hoverLift structure', () => {
      expect(hoverLift).toHaveProperty('whileHover')
      expect(hoverLift).toHaveProperty('transition')
      expect(hoverLift.whileHover).toEqual({ y: -5 })
      expect(hoverLift.transition).toEqual({ duration: 0.2 })
    })
  })

  describe('Loading animations', () => {
    it('should have correct spinAnimation structure', () => {
      expect(spinAnimation).toHaveProperty('animate')
      expect(spinAnimation).toHaveProperty('transition')
      expect(spinAnimation.animate).toEqual({ rotate: 360 })
      expect(spinAnimation.transition).toEqual({
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      })
    })

    it('should have correct pulseAnimation structure', () => {
      expect(pulseAnimation).toHaveProperty('animate')
      expect(pulseAnimation).toHaveProperty('transition')
      expect(pulseAnimation.animate).toEqual({ scale: [1, 1.1, 1] })
      expect(pulseAnimation.transition).toEqual({
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      })
    })
  })

  describe('Page and modal animations', () => {
    it('should have correct pageTransition structure', () => {
      expect(pageTransition).toHaveProperty('initial')
      expect(pageTransition).toHaveProperty('animate')
      expect(pageTransition).toHaveProperty('exit')
      expect(pageTransition).toHaveProperty('transition')
      expect(pageTransition.initial).toEqual({ opacity: 0, y: 20 })
      expect(pageTransition.animate).toEqual({ opacity: 1, y: 0 })
      expect(pageTransition.exit).toEqual({ opacity: 0, y: -20 })
      expect(pageTransition.transition).toEqual({ duration: 0.3, ease: "easeOut" })
    })

    it('should have correct modalAnimation structure', () => {
      expect(modalAnimation).toHaveProperty('initial')
      expect(modalAnimation).toHaveProperty('animate')
      expect(modalAnimation).toHaveProperty('exit')
      expect(modalAnimation).toHaveProperty('transition')
      expect(modalAnimation.initial).toEqual({ opacity: 0, scale: 0.8, y: 20 })
      expect(modalAnimation.animate).toEqual({ opacity: 1, scale: 1, y: 0 })
      expect(modalAnimation.exit).toEqual({ opacity: 0, scale: 0.8, y: 20 })
      expect(modalAnimation.transition).toEqual({ duration: 0.2, ease: "easeOut" })
    })
  })

  describe('UI component animations', () => {
    it('should have correct dropdownAnimation structure', () => {
      expect(dropdownAnimation).toHaveProperty('initial')
      expect(dropdownAnimation).toHaveProperty('animate')
      expect(dropdownAnimation).toHaveProperty('exit')
      expect(dropdownAnimation).toHaveProperty('transition')
      expect(dropdownAnimation.initial).toEqual({ opacity: 0, y: -10, scale: 0.95 })
      expect(dropdownAnimation.animate).toEqual({ opacity: 1, y: 0, scale: 1 })
      expect(dropdownAnimation.exit).toEqual({ opacity: 0, y: -10, scale: 0.95 })
      expect(dropdownAnimation.transition).toEqual({ duration: 0.15, ease: "easeOut" })
    })

    it('should have correct tooltipAnimation structure', () => {
      expect(tooltipAnimation).toHaveProperty('initial')
      expect(tooltipAnimation).toHaveProperty('animate')
      expect(tooltipAnimation).toHaveProperty('exit')
      expect(tooltipAnimation).toHaveProperty('transition')
      expect(tooltipAnimation.initial).toEqual({ opacity: 0, scale: 0.8 })
      expect(tooltipAnimation.animate).toEqual({ opacity: 1, scale: 1 })
      expect(tooltipAnimation.exit).toEqual({ opacity: 0, scale: 0.8 })
      expect(tooltipAnimation.transition).toEqual({ duration: 0.1, ease: "easeOut" })
    })

    it('should have correct tableRowAnimation structure', () => {
      expect(tableRowAnimation).toHaveProperty('initial')
      expect(tableRowAnimation).toHaveProperty('animate')
      expect(tableRowAnimation).toHaveProperty('exit')
      expect(tableRowAnimation).toHaveProperty('transition')
      expect(tableRowAnimation.initial).toEqual({ opacity: 0, y: 20 })
      expect(tableRowAnimation.animate).toEqual({ opacity: 1, y: 0 })
      expect(tableRowAnimation.exit).toEqual({ opacity: 0, y: -20 })
      expect(tableRowAnimation.transition).toEqual({ duration: 0.3 })
    })

    it('should have correct cardAnimation structure', () => {
      expect(cardAnimation).toHaveProperty('initial')
      expect(cardAnimation).toHaveProperty('animate')
      expect(cardAnimation).toHaveProperty('whileHover')
      expect(cardAnimation).toHaveProperty('transition')
      expect(cardAnimation.initial).toEqual({ opacity: 0, y: 20 })
      expect(cardAnimation.animate).toEqual({ opacity: 1, y: 0 })
      expect(cardAnimation.whileHover).toEqual({ y: -2 })
      expect(cardAnimation.transition).toEqual({ duration: 0.4, ease: "easeOut" })
    })

    it('should have correct buttonAnimation structure', () => {
      expect(buttonAnimation).toHaveProperty('whileHover')
      expect(buttonAnimation).toHaveProperty('whileTap')
      expect(buttonAnimation).toHaveProperty('transition')
      expect(buttonAnimation.whileHover).toEqual({ scale: 1.02 })
      expect(buttonAnimation.whileTap).toEqual({ scale: 0.98 })
      expect(buttonAnimation.transition).toEqual({ duration: 0.2, ease: "easeOut" })
    })

    it('should have correct iconAnimation structure', () => {
      expect(iconAnimation).toHaveProperty('whileHover')
      expect(iconAnimation).toHaveProperty('whileTap')
      expect(iconAnimation).toHaveProperty('transition')
      expect(iconAnimation.whileHover).toEqual({ scale: 1.1, rotate: 5 })
      expect(iconAnimation.whileTap).toEqual({ scale: 0.9 })
      expect(iconAnimation.transition).toEqual({ duration: 0.2 })
    })
  })
})
