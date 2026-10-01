exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Core OS Modules Table (The Forge)
  pgm.createTable('user_modules', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    owner_id: { type: 'uuid', notNull: true },
    parent_id: { type: 'uuid' },
    node_type: { type: 'varchar(100)' },
    name: { type: 'varchar(255)' },
    ui_state: { type: 'jsonb', default: '{}' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  }, { ifNotExists: true }); // <--- Critical: Protects your existing live data

  // 2. Vendor Ad Engine Table
  pgm.createTable('ad_inventory', {
    id: { type: 'serial', primaryKey: true },
    campaign: { type: 'varchar(255)' },
    type: { type: 'varchar(100)' },
    headline: { type: 'varchar(255)' },
    subtext: { type: 'text' },
    target_url: { type: 'text' },
    bg_color: { type: 'varchar(50)' },
    text_color: { type: 'varchar(50)' },
    internal_page_content: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  }, { ifNotExists: true }); // <--- Critical: Protects your existing live data
};

exports.down = (pgm) => {
  // This allows you to safely roll back changes if you ever make a mistake
  pgm.dropTable('ad_inventory', { ifExists: true });
  pgm.dropTable('user_modules', { ifExists: true });
};