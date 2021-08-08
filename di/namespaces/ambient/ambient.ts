namespace $ {
	export function $ambient(
		this: $,
		over = {} as Partial< $ >,
	): $ {
		const context = Object.create( this )
		for( const field of Object.getOwnPropertyNames( over ) ) {
			const descr = Object.getOwnPropertyDescriptor( over, field )!
			Object.defineProperty( context, field, descr )
		}
		return context
	}
}
