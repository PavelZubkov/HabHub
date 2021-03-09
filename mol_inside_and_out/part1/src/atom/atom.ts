class Atom<Value> {
    static running: Atom<any>

    status: 'actual'|'outdated' = 'outdated'

    cachedValue: Value
    cachedNext: any
    
    slaves = new Set<Atom<any>>()
    masters = new Set<Atom<any>>()

    constructor(
        public name: string,
        public formula: (next?: any) => Value = (next => next)
    ) {}
    
    get() {
        if (Atom.running) {
            Atom.running.masters.add(this)
            this.slaves.add(Atom.running)
        }

        if (this.status === 'outdated') {
            this.actualize()
        }
        return this.cachedValue
    }
    
    actualize() {
        const slave = Atom.running
        Atom.running = this

        this.cachedValue = this.pull()
        this.status = 'actual'

        Atom.running = slave
    }
    
    pull() {
        return this.formula(this.cachedNext)
    }
    
    put(next: any) {
        this.cachedNext = next
        this.outdate()
        return this.cachedValue
    }
    
    outdate() {
        this.status = 'outdated'

        if (this.slaves.size === 0) {
            this.actualize()
        }

        for (const slave of this.slaves) {
            slave.outdate()
        }
    }
}

export default Atom