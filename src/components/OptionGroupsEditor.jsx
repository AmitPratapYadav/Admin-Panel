import { Plus, Trash2 } from 'lucide-react';

const OptionGroupsEditor = ({
  title = 'Variant Options',
  description = '',
  priceLabel = 'Price Modifier',
  priceHelpText = '',
  groups = [],
  onChange = () => {},
  onLoadTemplate = null,
  loadingTemplate = false,
}) => {
  const updateGroups = (nextGroups) => {
    onChange(nextGroups);
  };

  const updateGroupField = (groupIndex, field, value) => {
    updateGroups(
      groups.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              [field]: value,
            }
          : group
      )
    );
  };

  const updateValueField = (groupIndex, valueIndex, field, value) => {
    updateGroups(
      groups.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              values: group.values.map((optionValue, currentValueIndex) =>
                currentValueIndex === valueIndex
                  ? {
                      ...optionValue,
                      [field]: value,
                    }
                  : field === 'is_default' && value
                  ? {
                      ...optionValue,
                      is_default: false,
                    }
                  : optionValue
              ),
            }
          : group
      )
    );
  };

  const addGroup = () => {
    updateGroups([
      ...groups,
      {
        name: '',
        code: '',
        display_type: 'button',
        is_required: true,
        sort_order: groups.length,
        values: [
          {
            label: '',
            value: '',
            price_modifier: 0,
            is_default: true,
            is_active: true,
            sort_order: 0,
          },
        ],
      },
    ]);
  };

  const removeGroup = (groupIndex) => {
    updateGroups(groups.filter((_, index) => index !== groupIndex));
  };

  const addValue = (groupIndex) => {
    updateGroups(
      groups.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              values: [
                ...group.values,
                {
                  label: '',
                  value: '',
                  price_modifier: 0,
                  is_default: false,
                  is_active: true,
                  sort_order: group.values.length,
                },
              ],
            }
          : group
      )
    );
  };

  const removeValue = (groupIndex, valueIndex) => {
    updateGroups(
      groups.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              values: group.values.filter((_, currentValueIndex) => currentValueIndex !== valueIndex),
            }
          : group
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          {onLoadTemplate ? (
            <button
              type="button"
              onClick={onLoadTemplate}
              disabled={loadingTemplate}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loadingTemplate ? 'Loading Template...' : 'Load Category Template'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={addGroup}
            className="inline-flex items-center gap-2 rounded-xl bg-[#9BCBBF] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={16} />
            Add Variant Group
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
          No variant groups added yet.
        </div>
      ) : null}

      {groups.map((group, groupIndex) => (
        <div key={`group-${groupIndex}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Group {groupIndex + 1}</h3>
            <button
              type="button"
              onClick={() => removeGroup(groupIndex)}
              className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
              <input
                type="text"
                value={group.name}
                onChange={(e) => updateGroupField(groupIndex, 'name', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
              <input
                type="text"
                value={group.code || ''}
                onChange={(e) => updateGroupField(groupIndex, 'code', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Type</label>
              <select
                value={group.display_type}
                onChange={(e) => updateGroupField(groupIndex, 'display_type', e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
              >
                <option value="button">Button</option>
                <option value="radio">Radio</option>
                <option value="select">Select</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!group.is_required}
                  onChange={(e) => updateGroupField(groupIndex, 'is_required', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Required
              </label>

              <input
                type="number"
                min="0"
                value={group.sort_order ?? groupIndex}
                onChange={(e) => updateGroupField(groupIndex, 'sort_order', Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                placeholder="Sort"
              />
            </div>
          </div>

          <div className="space-y-3">
            {group.values.map((optionValue, valueIndex) => (
              <div key={`group-${groupIndex}-value-${valueIndex}`} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">Option {valueIndex + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeValue(groupIndex, valueIndex)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                    <input
                      type="text"
                      value={optionValue.label}
                      onChange={(e) => updateValueField(groupIndex, valueIndex, 'label', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                    <input
                      type="text"
                      value={optionValue.value || ''}
                      onChange={(e) => updateValueField(groupIndex, valueIndex, 'value', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{priceLabel}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={optionValue.price_modifier ?? 0}
                      onChange={(e) => updateValueField(groupIndex, valueIndex, 'price_modifier', Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                    />
                    {priceHelpText ? (
                      <p className="mt-1 text-xs text-gray-500">{priceHelpText}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                    <input
                      type="number"
                      min="0"
                      value={optionValue.sort_order ?? valueIndex}
                      onChange={(e) => updateValueField(groupIndex, valueIndex, 'sort_order', Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#9BCBBF]"
                    />
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!optionValue.is_default}
                      onChange={(e) => updateValueField(groupIndex, valueIndex, 'is_default', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Default option
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={optionValue.is_active ?? true}
                      onChange={(e) => updateValueField(groupIndex, valueIndex, 'is_active', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Active option
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addValue(groupIndex)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus size={16} />
              Add Option Value
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OptionGroupsEditor;
