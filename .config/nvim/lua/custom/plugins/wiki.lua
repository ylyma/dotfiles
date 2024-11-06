return {
  'lervag/wiki.vim',

  keys = {
    { '<leader>wl', '<cmd>WikiTags<cr>', desc = 'List wiki tags' },
    { '<leader>wp', '<cmd>WikiPages<cr>', desc = 'List wiki pages' },
  },
  init = function()
    vim.g.wiki_root = '~/wiki'
    vim.g.wiki_select_method = {
      pages = require('wiki.telescope').pages,
      tags = require('wiki.telescope').tags,
      toc = require('wiki.telescope').toc,
      links = require('wiki.telescope').links,
    }
  end,
}
