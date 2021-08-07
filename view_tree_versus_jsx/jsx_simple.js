/*
$my_example $mol_view
    sub /
        <= Panel $my_bipanel
            left <= input /
                <= Editable $mol_check_box
                    checked?val <=> editable?val true
                    title @ \Editable
*/

const MyExample = (p) => {
  const editable = useVal(true)
  
  const Editable = p.Editable ?? <mol_check_box
    val={editable}
    title="Editable"
  />

  const input = p.Input ?? <>
    {Editable}
  </>
    
  const Panel = p.Panel ?? (
    <MyBipanel
      left={input}
    />
  )

  return p.children ?? <>
    {Panel}
  </>
}

const $MyExample = (p) => {

  return <MyExample

  />

}