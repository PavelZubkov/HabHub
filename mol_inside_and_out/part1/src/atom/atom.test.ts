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

test('actualization when called "get"', () => {
    const TAX = 1.2

    const count = new Atom('count', next => next ?? 1)
    const subTotal = new Atom('cost', () => 5 * count.get())
    const total = new Atom('total', () => subTotal.get() * TAX)
    
    assertEqual(total.get(), 5 * 1 * TAX)
    count.put(2)
    assertEqual(total.get(), 5 * 2 * TAX)
})

test('disable laziness when autorun enabled', () => {
    const TAX = 2
    let lastTotal

    const count = new Atom('count', next => next ?? 1)
    const subTotal = new Atom('cost', () => 5 * count.get())
    const total = new Atom('total', () => {
        lastTotal = subTotal.get() * TAX 
        return lastTotal
    })
    total.autorun = true

    total.get()
    assertEqual(lastTotal, 5 * 1 * TAX)

    count.put(2)
    Atom.executeTasks() // Run deferred tasks manually

    assertEqual(lastTotal, 5 * 2 * TAX)
})

test('batched actualization', () => {
    const TAX = 2
    let callCount = 0

    const count = new Atom('count', next => next ?? 1)
    const subTotal = new Atom('cost', price => (price ?? 5) * count.get())
    const total = new Atom('total', () => {
        callCount += 1
        return subTotal.get() * TAX 
    })
    total.autorun = true

    total.get()
    assertEqual(callCount, 1)

    count.put(2)
    subTotal.put(10)
    Atom.executeTasks() // run deferred tasks manually

    assertEqual(callCount, 2)
})