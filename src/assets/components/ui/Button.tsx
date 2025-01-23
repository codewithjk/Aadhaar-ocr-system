import React from 'react'

function Button(children: string | undefined) {
  return (
      <div>
          <button>{children}</button>
    </div>
  )
}

export default Button