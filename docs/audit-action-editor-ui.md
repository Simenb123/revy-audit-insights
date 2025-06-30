# Audit Action Editor UI

This page outlines how to build a friendly editor for creating or editing audit action templates.
It ties together the audit phases described in [audit-phases.md](audit-phases.md) and the form components used in the frontend.

## Relation to audit phases

When defining a template, the user chooses which phases the action applies to. These phases correspond to the seven steps listed in [audit-phases.md](audit-phases.md). Storing the selection in `applicable_phases` allows the action to appear only in the relevant part of the engagement.

## Core form sections

### Basic fields

The `BasicFields` component contains inputs for name, subject area, action type and risk level. It uses an input box for the name and drop-down menus for the categorical values:

```tsx
<>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField control={form.control} name="name" render={({ field }) => (
      <FormItem>
        <FormLabel>Navn *</FormLabel>
        <FormControl>
          <Input placeholder="Navn på handlingen" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <!-- ...subject area and action type selects... -->
  </div>
</>
```

These selects let the user pick predefined values without typing, keeping the form consistent.

### Detail fields

`DetailFields` gathers the objective, procedures, documentation requirements and other numeric fields such as estimated hours. Text areas provide ample space for descriptions while number inputs ensure proper validation.

### Phase selection

`PhaseSelection` presents checkboxes in a grid so multiple phases can be chosen at once:

```tsx
<FormField control={form.control} name="applicable_phases" render={() => (
  <FormItem>
    <FormLabel>Anvendelige faser *</FormLabel>
    <FormDescription>Velg hvilke faser denne handlingen kan brukes i</FormDescription>
    <div className="grid grid-cols-2 gap-4">
      {phaseOptions.map((phase) => (
        <FormField key={phase.value} control={form.control} name="applicable_phases" render={({ field }) => (
          <FormItem key={phase.value} className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value?.includes(phase.value)}
                onCheckedChange={(checked) => {
                  return checked
                    ? field.onChange([...field.value, phase.value])
                    : field.onChange(field.value?.filter((value) => value !== phase.value));
                }}
              />
            </FormControl>
            <FormLabel className="text-sm font-normal">{phase.label}</FormLabel>
          </FormItem>
        )} />
      ))}
    </div>
    <FormMessage />
  </FormItem>
)} />
```

Checkboxes make it clear that more than one phase may be selected. The labels come from the `phaseLabels` constant so the terminology stays consistent across the application.

## Exploring other designs

The editor components are split into small pieces so you can experiment with different layouts. You might combine drop-down menus with toggle switches or add helper text near each field. React Hook Form manages validation, allowing you to mix and match controls while still capturing the data structure required by `audit_action_templates`.

By using checkboxes, text inputs and selects together, auditors can quickly create actions that fit the current phase and subject area without typing everything from scratch.

## Implementation plan

To build and iterate on this editor you can break the work into a few small tasks:

1. **Set up the container component** – Render `ImprovedCreateActionTemplateForm` inside the admin panel or another page.
2. **Split the form** – Keep `BasicFields`, `DetailFields` and `PhaseSelection` as individual components so each section can be reused.
3. **Wire up validation** – Use React Hook Form with `createActionTemplateFormSchema` for field validation and type safety.
4. **Connect to the API** – Persist templates with the `useCreateAuditActionTemplate` hook and show a spinner while saving.
5. **Add controls** – Provide Save and Cancel buttons; disable them while the mutation is pending.
6. **Experiment with layout** – Try toggles, helper text or grouped inputs to see which design feels best.

Working through these tasks incrementally lets you refine the user experience before moving on to advanced features.
