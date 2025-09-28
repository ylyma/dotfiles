return {
  'lervag/wiki.vim',
  enabled = vim.fn.isdirectory(vim.fn.expand '~/wiki') == 1,
  keys = {
    { '<leader>wl', '<cmd>WikiTags<cr>', desc = 'List wiki tags' },
    { '<leader>wp', '<cmd>WikiPages<cr>', desc = 'List wiki pages' },
  },
  init = function()
    vim.g.wiki_root = '~/wiki'
    vim.g.wiki_select_method = {
      pages = require('wiki.ui_select').pages,
      tags = require('wiki.ui_select').tags,
      toc = require('wiki.ui_select').toc,
      links = require('wiki.ui_select').links,
    }
  end,
}
