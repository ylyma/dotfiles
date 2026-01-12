return {
  'hedyhli/markdown-toc.nvim',
  ft = 'markdown',
  cmd = { 'Mtoc' },
  opts = {
    headings = {
      before_toc = false,
    },
    fences = {
      enabled = true,
      start_text = 'mtoc-start',
      end_text = 'mtoc-end',
    },
    auto_update = true, -- This enables auto-update on save
    toc_list = {
      markers = '*',
      cycle_markers = false,
    },
  },
  config = function(_, opts)
    require('mtoc').setup(opts)

    vim.api.nvim_create_autocmd('FileType', {
      pattern = 'markdown',
      callback = function()
        vim.keymap.set('n', '<leader>mt', ':Mtoc<CR>', { buffer = true, silent = true, desc = 'Generate/update TOC' })
      end,
    })
  end,
}
