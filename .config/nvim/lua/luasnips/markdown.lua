local ls = require 'luasnip'
local s = ls.snippet
local t = ls.text_node
local i = ls.insert_node

return {
  s('dp', {
    t '<details> <!-- {{{ -->',
    t { '', '<summary>' },
    i(1, 'summary'),
    t { '</summary>', '' },
    i(2, 'content'),
    t { '', '</details> <!-- }}} -->' },
    i(0),
  }),
}
