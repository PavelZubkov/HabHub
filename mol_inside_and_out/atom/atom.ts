// import * as assert from 'assert'

type Formula<Value> = ((next?: any) => Value)

enum Status {
    actual = 'actual',
    outdated = 'outdated',
    pulling = 'pulling',
}
    
const atoms = []

class Atom<Value> {
    static stack: Atom<any>[] = []

    constructor(
        name: string,
        formula: Formula<Value>
    ) {
        this.name = name;
        this.formula = formula;
        atoms.push(this)
    }
    
    name: string
    status: Status = Status.outdated
    formula: Formula<Value> 
    cached_value: any
    cached_next: any

    masters = new Set<Atom<any>>()
    slaves = new Set<Atom<any>>()
    
    get() {
        console.log(`${this.name}.get`)
        if (this.status === Status.outdated) {
            this.pull()
        }
        return this.cached_value
    }
    
    set(next: any) {
        console.log(`${this.name}.set()`)
        this.cached_next = next
        this.status = Status.outdated
        
        for (const slave of Array.from(this.slaves)) {
            slave.status = Status.outdated
            slave.pull()
        }
    }
    
    pull() {
        console.log(`${this.name}.pull()`)
        
        if (this.status === Status.pulling) {
            throw new Error('Recursive dependence')
        }

        this.status = Status.pulling

        const slaveWhoCalledMe = Atom.stack[Atom.stack.length - 1]

        if (slaveWhoCalledMe) {
            this.slaves.add(slaveWhoCalledMe)
            slaveWhoCalledMe.masters.add(this)
        }

        Atom.stack.push(this)
        
        const value = this.formula(this.cached_next)

        const changed = value !== this.cached_value

        this.cached_value = value
        this.status = Status.actual
        
        if (changed) {
            for (const slave of Array.from(this.slaves)) {
                if (slave !== slaveWhoCalledMe) {
                    slave.status = Status.outdated
                    slave.pull()
                }
            }
        }
        
        Atom.stack.pop()
    }
}

function test(desc: string, fn: () => void) {
    try {
        fn()
        console.log('=======', desc, 'OK')
    } catch (error) {
        console.log('=======', desc, '\n', error.stack)
    }
}

// test('caching', () => {
//     const random  = new Atom('random', () => Math.random())
//     assert.strictEqual(random.get(), random.get())
// })

// test('default', () => {
//     const atom = new Atom('atom', next => next || 'default')
    
//     assert.strictEqual('default', atom.get())
//     atom.set('changed')
//     assert.strictEqual('changed', atom.get())
// })

// test('present atom called', () => {
//     let value
//     const atom = new Atom('atom', next => next || 1)
//     const present = new Atom('present', () => value = atom.get())
//     console.log(1)
//     debugger
//     present.get()
//     assert.strictEqual(value, 1)
//     console.log(2)
//     atom.set(2)
//     assert.strictEqual(value, 2)
// })

// Теперь мне надо сделать декоратор
// Дожно быть два типа (key, value) и (value)
// Кеширование

function mem<
    Host extends object,
    Field extends keyof Host,
    Prop extends Extract<Host[Field], (next?:any) => any>
>(
    proto: Host,
    name: Field,
    descriptor: TypedPropertyDescriptor<Prop>
) {
    // function value(this: Host, next?: any): any {
    //     let atom = this[`Atom.${name.toString()}`]
    //     if (!atom) {
    //         atom = this[`Atom.${name.toString()}`] = new Atom(name.toString(), descriptor.value.bind(this))
    //     }
    
    //     if (next !== undefined) {
    //         atom.set(next)
    //     }
    //     return atom.get()
    // }    

    function value(this: Host, next?: any): any {
        let atom = this[`Atom.${name.toString()}`]
        if (!atom) {
            const atomName = `${this.constructor.name}.${name.toString()}`
            atom = this[`Atom.${name.toString()}`] = new Atom(atomName, descriptor.value.bind(this))
        }
    
        if (next !== undefined) {
            atom.set(next)
        }
        return atom.get()
    }    

    return { ...descriptor, value }
}

test('autocall when depend property changed', () => {
    let count = 0

    class X {
        
        @mem
        userName(next?: string) {
            if (next) {
                return next
            }
            return 'Anon'
        }
        
        @mem
        sayHello() {
            console.log('----called')
            const userName = this.userName()
            count += 1
            return userName
        }
    }
    
    const x = new X;
    const output = x.sayHello()
    console.log({ output })
})

// test('static reactive properties', () => {
//     class X {
//         @mem
//         static root(next?: number) {
//             return next ?? 1
//         }
//     }
    
//     console.log(X.root())
//     X.root(2)
//     console.log(X.root())
// })

const Views = {}

// Должен быть начальный моунт в дом
class View {
    static mount() {
        const node = document.getElementById('root')

        const name = node.getAttribute('view_root')
        const view = new Views[name]
        view.domNode(node)
        view.domTree()
    }
    
    @mem
    domNode(next?: Element): Element {
        const node = next || document.createElement(this.tag())
        
        const events = this.event()
        for (const name in events) {
            node.addEventListener(name, events[name])
        }
        
        return node
    }
    
    @mem
    domNodeActual() {
        const node = this.domNode()
        
        const attrs = this.attr()
        for (const name in attrs) {
            node.setAttribute(name, String(attrs[name]))
        }
        
        const fields = this.attr()
        for (const name in fields) {
            node[name] = fields[name]
        }
        
        return node
    }
    
    @mem
    domTree(): Element {
        const node = this.domNodeActual()
        
        const nodes = this.children().map(child => {
            if (child === null) return child
            return child instanceof View ? child.domTree() : String(child)
        })
        
        // remove children
        node.innerHTML = ''
        
        for (const view of nodes) {
            if (view === null) continue

            if (view instanceof Node) {
                node.append(view)
            } else {
                const textNode = document.createTextNode(String(view))
                node.append(textNode)
            }
        }
        
        return node
    }

    tag() {
        return 'div'
    }
    
    children() {
        return [] as Array<View | Node | string | number | boolean>
    }
    
    attr(): { [key: string]: string|number|boolean|null } {
        return {}
    }
    
    field(): { [key: string]: any } {
        return {}
    }
    
    style(): { [key: string]: string|number } {
        return {}
    }
    
    event(): { [key: string]: (e: Event) => any } {
        return {}
    }
    
}
Views[View.name] = View

class Button extends View {
    title() {
        return ''
    }

    disabled() {
        return false
    }
    
    onClick(event?: Event) {
        return null
    }
    
    attr() {
        return {
            ...super.attr(),
            role: 'button',
        }
    }
    
    event() {
        return {
            ...super.event(),
            click: (event?: Event) => this.onClick(event),
        }
    }
    
    tag() {
        return 'button'
    }
    
    children() {
        return [
            this.title(),
        ]
    }
}
Views[Button.name] = Button 

class Input extends View {
    eventInput(event: Event) {
        return this.value((event.target as HTMLInputElement).value )
    }
    
    @mem
    value(next?: string): string {
        return next || ''
    }
    
    placeholder() {
        return ''
    }

    tag() {
        return 'input'
    }
    
    attr() {
        return {
            type: 'text',
        }
    }
    
    event() {
        return {
            input: (event: Event) => this.eventInput(event),
        }
    }
}
Views[Input.name] = Input

class App extends View {
    sayHello(event: Event) {
        alert(`Hello ${this.userName()}!`)
    }
    
    sayHelloTitle() {
        return 'say hello'
    }
    
    @mem
    userName(next?: string) {
        console.log('eee')
        return next || 'Anon'
    }
    
    @mem
    Button() {
        const obj = new Button
        obj.onClick = (event: Event) => this.sayHello(event),
        obj.title = () => this.sayHelloTitle()
        return obj
    }
    
    @mem
    Input() {
        const obj = new Input
        obj.value = (next: string) => this.userName(next)
        return obj
    }
    
    @mem
    Name() {
        const obj = new View
        obj.children = () => [this.userName()]
        return obj
    }
    
    children() {
        return [
            this.Input(),
            this.Button(),
            this.Name(),
        ]
    }
}
Views[App.name] = App
console.log(Views)

var nodes = document.querySelectorAll( '[view_root]' )
for( let i = nodes.length - 1 ; i >= 0 ; --i ) {
    const View = Views[nodes[i].getAttribute('view_root')]
    const view = new View
    view.domNode( nodes[i] )
    view.domTree( nodes[i] )
}