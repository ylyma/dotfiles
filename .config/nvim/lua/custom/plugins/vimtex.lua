return {
  'lervag/vimtex',
  lazy = false, -- we don't want to lazy load VimTeX
  -- tag = "v2.15", -- uncomment to pin to a specific release
  init = function()
    -- VimTeX configuration goes here
    vim.g.vim_view_method = 'zathura'
    vim.g.vimtex_syntax_enable = 1
    vim.g.vimtex_indent_enable = 1
  end,
}
