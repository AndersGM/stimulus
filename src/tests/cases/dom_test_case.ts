import { TestCase } from "./test_case"

interface TriggerEventOptions {
  bubbles?: boolean
  setDefaultPrevented?: boolean
}

const defaultTriggerEventOptions: TriggerEventOptions = {
  bubbles: true,
  setDefaultPrevented: true,
}

export class DOMTestCase extends TestCase {
  fixtureSelector = "#qunit-fixture"
  fixtureHTML = ""

  async runTest(testName: string) {
    await this.renderFixture()
    await super.runTest(testName)
  }

  async renderFixture(fixtureHTML = this.fixtureHTML) {
    this.fixtureElement.innerHTML = fixtureHTML
    return this.nextFrame
  }

  get fixtureElement(): Element {
    const element = document.querySelector(this.fixtureSelector)
    if (element) {
      return element
    } else {
      throw new Error(`missing fixture element "${this.fixtureSelector}"`)
    }
  }

  async triggerEvent(selectorOrTarget: string | EventTarget, type: string, options: TriggerEventOptions = {}) {
    const { bubbles, setDefaultPrevented } = { ...defaultTriggerEventOptions, ...options }
    const eventTarget = typeof selectorOrTarget == "string" ? this.findElement(selectorOrTarget) : selectorOrTarget
    const event = document.createEvent("Events")
    event.initEvent(type, bubbles, true)

    // IE <= 11 does not set `defaultPrevented` when `preventDefault()` is called on synthetic events
    if (setDefaultPrevented) {
      event.preventDefault = function () {
        Object.defineProperty(this, "defaultPrevented", { get: () => true, configurable: true })
      }
    }

    eventTarget.dispatchEvent(event)
    await this.nextFrame
    return event
  }

  async triggerKeyboardEvent(selectorOrTarget: string | EventTarget, type: string, options: KeyboardEventInit = {}) {
    const eventTarget = typeof selectorOrTarget == "string" ? this.findElement(selectorOrTarget) : selectorOrTarget
    const event = new KeyboardEvent(type, options)

    eventTarget.dispatchEvent(event)
    await this.nextFrame
    return event
  }

  async setAttribute(selectorOrElement: string | Element, name: string, value: string) {
    const element = typeof selectorOrElement == "string" ? this.findElement(selectorOrElement) : selectorOrElement

    element.setAttribute(name, value)
    await this.nextFrame
  }

  async removeAttribute(selectorOrElement: string | Element, name: string) {
    const element = typeof selectorOrElement == "string" ? this.findElement(selectorOrElement) : selectorOrElement

    element.removeAttribute(name)
    await this.nextFrame
  }

  async appendChild<T extends Node>(selectorOrElement: T | string, child: T) {
    const parent = typeof selectorOrElement == "string" ? this.findElement(selectorOrElement) : selectorOrElement

    parent.appendChild(child)
    await this.nextFrame
  }

  async remove(selectorOrElement: Element | string) {
    const element = typeof selectorOrElement == "string" ? this.findElement(selectorOrElement) : selectorOrElement

    element.remove()
    await this.nextFrame
  }

  findElement(selector: string) {
    const element = this.fixtureElement.querySelector(selector)
    if (element) {
      return element
    } else {
      throw new Error(`couldn't find element "${selector}"`)
    }
  }

  findElements(...selectors: string[]) {
    return selectors.map((selector) => this.findElement(selector))
  }

  get nextFrame(): Promise<any> {
    return new Promise((resolve) => requestAnimationFrame(resolve))
  }
}
