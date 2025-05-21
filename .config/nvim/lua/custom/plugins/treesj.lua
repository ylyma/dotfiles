return {
  'Wansmer/treesj',
  keys = { '<space>j' },
  dependencies = { 'nvim-treesitter/nvim-treesitter' }, -- if you install parsers with `nvim-treesitter`
  config = function()
    require('treesj').setup { use_default_keymaps = false }
    -- For default preset
    vim.keymap.set('n', '<leader>m', require('treesj').toggle)
    -- For extending default preset with `recursive = true`
    vim.keymap.set('n', '<leader>M', function()
      require('treesj').toggle { split = { recursive = true } }
    end)
  end,
}
