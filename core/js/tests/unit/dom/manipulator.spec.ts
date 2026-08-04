import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import Manipulator from '../../../src/bootstrap/dom/manipulator'
import { clearFixture, getFixture } from '../../helpers/fixture'

describe('Manipulator', () => {
  let fixtureEl: HTMLElement
  let div: HTMLElement

  beforeAll(() => {
    fixtureEl = getFixture()
  })

  beforeEach(() => {
    fixtureEl.innerHTML = '<div></div>'
    div = fixtureEl.querySelector('div')!
  })

  afterEach(() => {
    clearFixture()
  })

  describe('setDataAttribute', () => {
    it('should set a data-fc-* attribute', () => {
      Manipulator.setDataAttribute(div, 'key', 'value')

      expect(div.getAttribute('data-fc-key')).toBe('value')
    })

    it('should convert camelCase keys to kebab-case', () => {
      Manipulator.setDataAttribute(div, 'testKey', '123')

      expect(div.getAttribute('data-fc-test-key')).toBe('123')
    })

    it('should overwrite existing value', () => {
      Manipulator.setDataAttribute(div, 'key', 'old')
      Manipulator.setDataAttribute(div, 'key', 'new')

      expect(div.getAttribute('data-fc-key')).toBe('new')
    })
  })

  describe('removeDataAttribute', () => {
    it('should remove data-fc-* attribute', () => {
      div.setAttribute('data-fc-key', 'value')
      Manipulator.removeDataAttribute(div, 'key')

      expect(div.getAttribute('data-fc-key')).toBeNull()
    })

    it('should remove data-bs-* attribute', () => {
      div.setAttribute('data-bs-key', 'value')
      Manipulator.removeDataAttribute(div, 'key')

      expect(div.getAttribute('data-bs-key')).toBeNull()
    })

    it('should remove both prefixes at once', () => {
      div.setAttribute('data-fc-key', 'a')
      div.setAttribute('data-bs-key', 'b')
      Manipulator.removeDataAttribute(div, 'key')

      expect(div.getAttribute('data-fc-key')).toBeNull()
      expect(div.getAttribute('data-bs-key')).toBeNull()
    })

    it('should handle camelCase keys', () => {
      div.setAttribute('data-fc-some-thing', 'x')
      Manipulator.removeDataAttribute(div, 'someThing')

      expect(div.getAttribute('data-fc-some-thing')).toBeNull()
    })
  })

  describe('getDataAttribute', () => {
    it('should prioritize data-fc-* over data-bs-*', () => {
      div.setAttribute('data-fc-key', 'fc-value')
      div.setAttribute('data-bs-key', 'bs-value')

      expect(Manipulator.getDataAttribute(div, 'key')).toBe('fc-value')
    })

    it('should fall back to data-bs-* if data-fc-* is absent', () => {
      div.setAttribute('data-bs-key', 'bs-value')

      expect(Manipulator.getDataAttribute(div, 'key')).toBe('bs-value')
    })

    it('should return null if neither prefix exists', () => {
      expect(Manipulator.getDataAttribute(div, 'missing')).toBeNull()
    })

    it('should normalize "true" to boolean true', () => {
      div.setAttribute('data-fc-flag', 'true')

      expect(Manipulator.getDataAttribute(div, 'flag')).toBe(true)
    })

    it('should normalize "false" to boolean false', () => {
      div.setAttribute('data-fc-flag', 'false')

      expect(Manipulator.getDataAttribute(div, 'flag')).toBe(false)
    })

    it('should normalize numeric strings to numbers', () => {
      div.setAttribute('data-fc-count', '42')

      expect(Manipulator.getDataAttribute(div, 'count')).toBe(42)
    })

    it('should normalize "null" to null', () => {
      div.setAttribute('data-fc-val', 'null')

      expect(Manipulator.getDataAttribute(div, 'val')).toBeNull()
    })

    it('should normalize empty string to null', () => {
      div.setAttribute('data-fc-val', '')

      expect(Manipulator.getDataAttribute(div, 'val')).toBeNull()
    })

    it('should parse JSON-encoded values', () => {
      div.setAttribute('data-fc-obj', '{"a":1}')

      expect(Manipulator.getDataAttribute(div, 'obj')).toEqual({ a: 1 })
    })

    it('should return raw string for non-parseable values', () => {
      div.setAttribute('data-fc-val', 'hello world')

      expect(Manipulator.getDataAttribute(div, 'val')).toBe('hello world')
    })

    it('should handle camelCase key lookup', () => {
      div.setAttribute('data-fc-my-key', 'yes')

      expect(Manipulator.getDataAttribute(div, 'myKey')).toBe('yes')
    })
  })

  describe('getDataAttributes', () => {
    it('should return empty object for null element', () => {
      expect(Manipulator.getDataAttributes(null)).toEqual({})
    })

    it('should return empty object when no data attributes exist', () => {
      expect(Manipulator.getDataAttributes(div)).toEqual({})
    })

    it('should collect data-fc-* attributes', () => {
      div.setAttribute('data-fc-name', 'test')
      div.setAttribute('data-fc-count', '5')

      const attrs = Manipulator.getDataAttributes(div)

      expect(attrs.name).toBe('test')
      expect(attrs.count).toBe(5)
    })

    it('should collect data-bs-* attributes', () => {
      div.setAttribute('data-bs-toggle', 'modal')

      const attrs = Manipulator.getDataAttributes(div)

      expect(attrs.toggle).toBe('modal')
    })

    it('should prioritize fc over bs for the same key', () => {
      div.setAttribute('data-fc-key', 'fc')
      div.setAttribute('data-bs-key', 'bs')

      const attrs = Manipulator.getDataAttributes(div)

      expect(attrs.key).toBe('fc')
    })

    it('should exclude *Config attributes', () => {
      div.setAttribute('data-fc-config', '{}')
      div.setAttribute('data-bs-config', '{}')
      div.setAttribute('data-fc-name', 'hello')

      const attrs = Manipulator.getDataAttributes(div)

      expect(attrs.name).toBe('hello')
      expect('config' in attrs).toBe(false)
    })

    it('should normalize all values', () => {
      div.setAttribute('data-fc-flag', 'true')
      div.setAttribute('data-fc-num', '10')
      div.setAttribute('data-fc-nil', 'null')

      const attrs = Manipulator.getDataAttributes(div)

      expect(attrs.flag).toBe(true)
      expect(attrs.num).toBe(10)
      expect(attrs.nil).toBeNull()
    })
  })
})
