class Atom2<Value> {
    static running: Atom2<any>

    status: 'actual' | 'outdated' | 'pulling' = 'outdated'

    cachedValue: Value
    cachedNext: any
    autorun = false
    
    slaves = new Set<Atom2<any>>()
    masters = new Set<Atom2<any>>()

    constructor(
        public name: string,
        public formula: (next?: any) => Value = (next => next)
    ) {}
    
    get() {
        if (this.status === 'pulling') {
            throw new AtomErrorRecursive
        }

        if (Atom2.running) {
            Atom2.running.masters.add(this)
            this.slaves.add(Atom2.running)
        }

        if (this.status === 'outdated') {
            this.actualize()
        }

        return this.cachedValue
    }
    
    actualize() {
        const slave = Atom2.running
        Atom2.running = this

        this.status = 'pulling'

        this.cachedValue = this.pull()
        this.status = 'actual'

        Atom2.running = slave
    }
    
    pull() {
        return this.formula(this.cachedNext)
    }
    
    put(next: any) {
        this.cachedNext = next
        this.outdate()
    }

    outdate() {
        this.status = 'outdated'

        for (const slave of this.slaves) {
            slave.outdate()
        }
        
        if (this.autorun === true) {
            Atom2.scheduleTask(this, () => this.actualize())
            setTimeout(() => Atom2.executeScheduledTasks())
        }
    }
    
    static queue = []

    static scheduleTask(key, task) {
        this.queue.push({ key, task })
    }

    static executeScheduledTasks() {
        while (this.queue.length > 0) {
            const deferred = this.queue.pop()
            if (deferred === null) continue
            for (let i = 0; i < this.queue.length; i++) {
                if (this.queue[i].key === deferred.key) this.queue[i] = null
            }
            deferred.task()
        }
    }
    
    static error = {
        recursive: AtomErrorRecursive,
    }
}

export default Atom2