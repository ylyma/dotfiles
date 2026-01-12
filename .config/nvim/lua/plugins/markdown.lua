return {
  'tadmccorkle/markdown.nvim',
  ft = 'markdown',
  opts = {
    mappings = {
      inline_surround_toggle = 'gs', -- toggle emphasis/bold/etc
      inline_surround_toggle_line = 'gss',
      inline_surround_delete = 'ds', -- delete surrounding **text**
      inline_surround_change = 'cs', -- change **bold** to *italic*
      link_add = 'gl', -- add link
      link_follow = 'gx', -- follow link (URLs and headers)
      go_curr_heading = ']c',
      go_parent_heading = ']p',
      go_next_heading = ']]',
      go_prev_heading = '[[',
    },
    inline_surround = {
      emphasis = { key = 'i', txt = '*' }, -- gsi = toggle italic
      strong = { key = 'b', txt = '**' }, -- gsb = toggle bold
      strikethrough = { key = 's', txt = '~~' }, -- gss conflicts with line toggle
      code = { key = 'c', txt = '`' }, -- gsc = toggle code
    },
    link = {
      paste = {
        enable = true, -- auto-convert URLs to [](url) on paste
      },
    },
    toc = {
      markers = { '-' }, -- use - for TOC lists
    },
  },
}
