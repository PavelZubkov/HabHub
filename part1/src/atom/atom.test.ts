import { test, assertEqual } from '../test/test'
import Atom from './atom'

test('caching', () => {
    const random = new Atom('random', () => Math.random())

    assertEqual(random.get(), random.get())
})

test('laziness', () => {
    let value = 0
    const atom = new Atom('atom', () => { value = 1 })
    
    assertEqual(value, 0)
    atom.get()
    assertEqual(value, 1)
})

test('default value', () => {
    const atom = new Atom('atom', next => next ?? 'default')

    assertEqual(atom.get(), 'default')
})

test('change value', () => {
    const name = new Atom('name', next => next ?? 'Unknown')
    name.put('Username')
    
    assertEqual(name.get(), 'Username')
})

test('auto actualization', () => {
    const count = new Atom('count', next => next ?? 1)
    const cost = new Atom('cost', () => 5)
    const total = new Atom('total', () => cost.get() * count.get())
    
    assertEqual(total.get(), 5 * 1)
    count.put(2)
    assertEqual(total.get(), 5 * 2)
})

