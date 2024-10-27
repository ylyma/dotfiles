return {
  'vimwiki/vimwiki',
  init = function()
    vim.g.vimwiki_list = {
      {
        path = '~/vimwiki',
        syntax = 'markdown',
        ext = '.md',
        diary_frequency = 'weekly',
      },
    }
    vim.g.vimwiki_auto_header = 1
  end,
}
