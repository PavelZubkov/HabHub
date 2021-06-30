import { test, assertEqual } from '../test/test'
import Atom2 from './atom2'

test('caching', () => {
    const random = new Atom2('random', () => Math.random())

    assertEqual(random.get(), random.get())
})

test('laziness', () => {
    let value = 0
    const atom = new Atom2('atom', () => { value = 1 })
    
    assertEqual(value, 0)
    atom.get()
    assertEqual(value, 1)
})

test('default value', () => {
    const atom = new Atom2('atom', next => next ?? 'default')

    assertEqual(atom.get(), 'default')
})

test('change value', () => {
    const name = new Atom2('name', next => next ?? 'Unknown')
    name.put('Username')
    
    assertEqual(name.get(), 'Username')
})

test('actualization when called "get"', () => {
    const TAX = 1.2

    const count = new Atom2('count', next => next ?? 1)
    const subTotal = new Atom2('cost', () => 5 * count.get())
    const total = new Atom2('total', () => subTotal.get() * TAX)
    
    assertEqual(total.get(), 5 * 1 * TAX)
    count.put(2)
    assertEqual(total.get(), 5 * 2 * TAX)
})

test('disable laziness when autorun enabled', () => {
    const TAX = 2
    let lastTotal

    const count = new Atom2('count', next => next ?? 1)
    const subTotal = new Atom2('cost', () => 5 * count.get())
    const total = new Atom2('total', () => {
        lastTotal = subTotal.get() * TAX 
        return lastTotal
    })
    total.autorun = true

    total.get()
    assertEqual(lastTotal, 5 * 1 * TAX)

    count.put(2)
    Atom2.executeScheduledTasks() // Run deferred tasks manually

    assertEqual(lastTotal, 5 * 2 * TAX)
})

test('recursive dependency', () => {
    let a: Atom2<number>
    let b: Atom2<number>

    a = new Atom2('a', () => b.get() + 1)
    b = new Atom2('b', () => a.get() + 1)
    
    let error
    try {
        b.get()
    } catch (ex) {
        error = ex
    }
    
    assertEqual(error.constructor, Atom2.error.recursive)
})

test('batched actualization', () => {
    const TAX = 2
    let callCount = 0

    const count = new Atom2('count', next => next ?? 1)
    const subTotal = new Atom2('cost', price => (price ?? 5) * count.get())
    const total = new Atom2('total', () => {
        callCount += 1
        return subTotal.get() * TAX 
    })
    total.autorun = true

    total.get()
    assertEqual(callCount, 1)

    count.put(2)
    subTotal.put(10)
    Atom2.executeScheduledTasks() // run deferred tasks manually

    assertEqual(callCount, 2)
})

test('do not actualize when masters not changed', () => {
    let callCount = 0

    const source = new Atom2('source', next => next ?? 1)
    const middle = new Atom2('middle', () => Math.abs(source.get()))
    const target = new Atom2('target', () => {
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