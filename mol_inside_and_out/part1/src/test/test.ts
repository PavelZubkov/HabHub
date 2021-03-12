export function test(desc: string, fn: () => void) {
    try {
        fn()
        console.log(desc, '- OK',)
    } catch(error) {
        console.log(desc, '- ERROR', error.message)
    }
}

export function assertEqual(a: any, b: any) {
    if (a === b) return
    throw new Error(`Not equal:\n\texpectation="${a}" : ${typeof a}\n\treality="${b}" : ${typeof b}`)
}