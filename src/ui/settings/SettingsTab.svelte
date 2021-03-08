<script>
  import SettingItem from "./SettingItem.svelte";
  import Sources from "./Sources.svelte";
  import Dropdown from "./controls/Dropdown.svelte";
  import Toggle from "./controls/Toggle.svelte";

  let items = [
    {
      id: 1,
      color: "#7FA1C0",
      name: "Word Count",
    },
    {
      id: 2,
      color: "#BF616A",
      name: "Tasks",
    },
    {
      id: 3,
      color: "#ebcb8b",
      name: "Zettels",
    },
    {
      id: 4,
      color: "#b48ead",
      name: "Links",
    },
    {
      id: 5,
      color: "#5e81ac",
      name: "Backlinks",
    },
  ];
</script>

<div>
  <h3>General Settings</h3>
  <SettingItem
    name="Confirm before creating new note"
    description="Show a confirmation modal before creating a new note"
  >
    <Toggle slot="control" />
  </SettingItem>

  <h3>Sources</h3>
  <div class="setting-item-description">
    Configure what appears on the calendar and what shows in the hover menu.
    Drag to reorder.
  </div>
  <Sources {items} />

  <h3>Localization</h3>
  <SettingItem
    name="Start week on"
    description="Choose what day of the week to start. Select 'locale default' to use the default specified by moment.js"
  >
    <Dropdown slot="control" options={[]} />
  </SettingItem>
</div>
