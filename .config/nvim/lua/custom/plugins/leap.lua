return {
  'ggandor/leap.nvim',
  enabled = true,
  keys = {
    { 'zj', mode = { 'n', 'x', 'o' }, desc = 'Leap Forward to' },
    { 'zk', mode = { 'n', 'x', 'o' }, desc = 'Leap Backward to' },
    { 'Z', mode = { 'n', 'x', 'o' }, desc = 'Leap from Windows' },
  },
  config = function(_, opts)
    local leap = require 'leap'
    for k, v in pairs(opts) do
      leap.opts[k] = v
    end
    leap.opts.equivalence_classes = { ' \t\r\n', '([{', ')]}', '\'"`' }
    leap.opts.special_keys.prev_target = '<backspace>'
    leap.opts.special_keys.prev_group = '<backspace>'
    leap.create_default_mappings(false)
    vim.keymap.set({ 'n', 'x', 'o' }, 'zj', '<Plug>(leap-forward)')
    vim.keymao.set({ 'n', 'x', 'o' }, 'zk', '<Plug>(leap-backward)')
    vim.keymap.del({ 'x', 'o' }, 'x')
    vim.keymap.del({ 'x', 'o' }, 'X')
  end,
}
