local ls = require 'luasnip'
local s = ls.snippet
local t = ls.text_node
local i = ls.insert_node
local fmt = require('luasnip.extras.fmt').fmt

vim.keymap.set({ 'i', 's' }, '<C-k>', function()
  if ls.expand_or_jumpable() then
    ls.expand_or_jump()
  end
end, { silent = true })

vim.keymap.set({ 'i', 's' }, '<C-j>', function()
  if ls.jumpable(-1) then
    ls.jump(-1)
  end
end, { silent = true })

-- latex

ls.add_snippets('tex', {
  s('img', {
    t '\\includegraphics[scale=',
    i(1),
    t ']{',
    i(2),
    t '}',
  }),
})

ls.add_snippets('tex', {
  s('ite', {
    t { '\\begin{itemize}', '	\\item ' },
    i(1),
    t { ' ', '\\end{itemize}' },
  }),
})

ls.add_snippets('tex', {
  s('it', {
    t { ' ', '\\item ' },
  }),
})

ls.add_snippets('tex', {
  s('rarrow', {
    t { '$\\rightarrow$ ' },
  }),
})

ls.add_snippets('tex', {
  s('enu', {
    t { '\\begin{enumerate}', '	\\item ' },
    i(1),
    t { ' ', '\\end{enumerate}' },
  }),
})

ls.add_snippets('tex', {
  s('inco', {
    t '\\inlinecode{',
    i(1),
    t '}',
  }),
})

ls.add_snippets('tex', {
  s('bo', {
    t '\\textbf{',
    i(1),
    t '}',
  }),
})

ls.add_snippets('tex', {
  s('und', {
    t '\\underline{',
    i(1),
    t '}',
  }),
})

ls.add_snippets('tex', {
  s('code', {
    t { '\\begin{lstlisting}[style=' },
    i(1),
    t { ']', '' },
    i(2),
    t { ' ', '\\end{lstlisting}' },
  }),
})

ls.add_snippets('tex', {
  s('sec', {
    t '\\section{',
    i(1),
    t '}',
  }),
})

ls.add_snippets('tex', {
  s('sub', {
    t '\\subsection{',
    i(1),
    t '}',
  }),
})

ls.add_snippets('tex', {
  s('subs', {
    t '\\subsubsection{',
    i(1),
    t '}',
  }),
})

ls.add_snippets('tex', {
  s('subss', {
    t '\\subsubsubsection{',
    i(1),
    t '}',
  }),
})

ls.add_snippets('tex', {
  s('tab', {
    t '\\begin{tabular}{',
    i(1),
    t { '}', '' },
    i(2),
    t { ' ', '\\end{tabular}' },
  }),
})

ls.add_snippets('tex', {
  s('tabx', {
    t { '\\begin{tabularx}{\\textwidth}{ | >{\\raggedright\\arraybackslash}X | >{\\raggedright\\arraybackslash}X | }', '' },
    i(1),
    t { ' ', '\\end{tabularx}' },
  }),
})

ls.add_snippets('tex', {
  s('math', {
    t { '\\begin{align*}', '' },
    i(1),
    t { ' ', '\\end{align*}' },
  }),
})

ls.add_snippets('tex', {
  s('eqn', {
    t '\\[',
    i(1),
    t '\\]',
  }),
})
