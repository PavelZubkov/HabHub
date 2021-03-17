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
    Atom.executeScheduledTasks() // Run deferred tasks manually

    assertEqual(lastTotal, 5 * 2 * TAX)
})

test('recursive dependency', () => {
    let a: Atom<number>
    let b: Atom<number>

    a = new Atom('a', () => b.get() + 1)
    b = new Atom('b', () => a.get() + 1)
    
    let error
    try {
        b.get()
    } catch (ex) {
        error = ex
    }
    
    assertEqual(error.constructor, Atom.error.recursive)
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
    Atom.executeScheduledTasks() // run deferred tasks manually

    assertEqual(callCount, 2)
})

test('do not actualize when masters not changed', () => {
    let callCount = 0

    const source = new Atom('source', next => next ?? 1)
    const middle = new Atom('middle', () => Math.abs(source.get()))
    const target = new Atom('target', () => {
        callCount += 1
        return middle.get()
    })

    target.get()
    assertEqual(callCount, 1)

    debugger
    source.put(-1)
    target.get()

    assertEqual(callCount, 1)
})