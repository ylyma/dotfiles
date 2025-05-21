return {
  'andrewferrier/debugprint.nvim',
  -- opts = { … },
  dependencies = {
    'echasnovski/mini.nvim', -- Optional: Needed for line highlighting (full mini.nvim plugin)
    -- ... or ...

    'nvim-telescope/telescope.nvim', -- Optional: If you want to use the `:Debugprint search` command with telescope.nvim
  },
  config = function()
    -- [T]oggle debug [p]rints
    vim.keymap.set('n', '<leader>td', ':ToggleCommentDebugPrints<Return>')
    -- [D]elete debug [p]rints
    vim.keymap.set('n', '<leader>dp', ':DeleteDebugPrints<Return>')
  end,

  lazy = false, -- Required to make line highlighting work before debugprint is first used
}
