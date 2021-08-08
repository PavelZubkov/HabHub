namespace $ {
	export function $app( this: $ ) {
		this.$hello()
		this.$ambient({ $user_name: 'Admin' }).$hello()
	}

	$.$app()
}
