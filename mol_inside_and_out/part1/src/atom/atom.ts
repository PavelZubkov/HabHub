class AtomErrorRecursive extends Error {
    constructor() {
        super('Recursive dependency')
    }
}
class Atom<Value> {
    static running: Atom<any>

    status: 'actual' | 'outdated' | 'pulling' = 'outdated'

    cachedValue: Value
    cachedNext: any
    autorun = false
    
    slaves = new Set<Atom<any>>()
    masters = new Set<Atom<any>>()

    constructor(
        public name: string,
        public formula: (next?: any) => Value = (next => next)
    ) {}
    
    get() {
        if (this.status === 'pulling') {
            throw new AtomErrorRecursive
        }

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

        this.status = 'pulling'

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
    }

    outdate() {
        this.status = 'outdated'

        for (const slave of this.slaves) {
            slave.outdate()
        }
        
        if (this.autorun === true) {
            Atom.scheduleTask(this, () => this.actualize())
            setTimeout(() => Atom.executeScheduledTasks())
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

export default Atom