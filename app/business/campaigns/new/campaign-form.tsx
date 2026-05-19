"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { createCampaign } from "./actions";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const viewsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const platformOptions = [
  { label: "YouTube", value: "youtube" },
  { label: "TikTok", value: "tiktok" },
  { label: "Instagram", value: "instagram" },
];

const durationOptions = [
  { label: "No minimum", value: "" },
  { label: "15s", value: "15" },
  { label: "30s", value: "30" },
  { label: "60s", value: "60" },
  { label: "90s", value: "90" },
  { label: "2min", value: "120" },
];

function estimatedViews(totalBudget: string, cpmRate: string) {
  const budget = Number(totalBudget);
  const cpm = Number(cpmRate);

  if (!Number.isFinite(budget) || !Number.isFinite(cpm) || budget <= 0 || cpm <= 0) {
    return 0;
  }

  return Math.floor((budget / cpm) * 1000);
}

function minEndDateValue() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function formatPreviewDate(value: string) {
  if (!value) {
    return "Not selected";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function normalizeTag(value: string, prefix?: "#" | "@") {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return prefix && !trimmed.startsWith(prefix) ? `${prefix}${trimmed}` : trimmed;
}

export function CampaignForm({ error }: { error?: string }) {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [instructions, setInstructions] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [cpmRate, setCpmRate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [requiredMentions, setRequiredMentions] = useState<string[]>([]);
  const [requiredHashtags, setRequiredHashtags] = useState<string[]>([]);
  const [requiredTags, setRequiredTags] = useState<string[]>([]);
  const [dos, setDos] = useState<string[]>([]);
  const [donts, setDonts] = useState<string[]>([]);
  const [minDurationSeconds, setMinDurationSeconds] = useState("");
  const minEndDate = useMemo(() => minEndDateValue(), []);

  const coveredViews = useMemo(
    () => estimatedViews(totalBudget, cpmRate),
    [totalBudget, cpmRate],
  );

  const budgetLabel = Number(totalBudget) > 0 ? moneyFormatter.format(Number(totalBudget)) : "$0";
  const cpmLabel = Number(cpmRate) > 0 ? moneyFormatter.format(Number(cpmRate)) : "$0";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form
        action={createCampaign}
        className="space-y-5 rounded-lg border border-amber-200 bg-white p-6"
      >
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <label className="block">
          <span className="text-sm font-semibold text-amber-950">
            Campaign title
          </span>
          <input
            className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Summer tasting menu launch"
            required
            type="text"
            value={title}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-amber-950">Brief</span>
          <textarea
            className="mt-2 min-h-36 w-full resize-y rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            name="brief"
            onChange={(event) => setBrief(event.target.value)}
            placeholder="What the campaign is about and what creators should highlight."
            required
            value={brief}
          />
        </label>

        <section className="space-y-5 rounded-lg border border-amber-200 bg-[#fffaf0] p-4">
          <div>
            <h2 className="text-base font-semibold text-amber-950">
              Content Guidelines
            </h2>
            <p className="mt-1 text-sm text-amber-900/70">
              Add requirements creators should follow before submitting videos.
            </p>
          </div>

          <TagInput
            items={requiredMentions}
            label="Required mentions"
            name="requiredMentions"
            onChange={setRequiredMentions}
            placeholder="Must mention our promo price"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TagInput
              items={requiredHashtags}
              label="Required hashtags"
              name="requiredHashtags"
              onChange={setRequiredHashtags}
              placeholder="AsailEats"
              prefix="#"
            />
            <TagInput
              items={requiredTags}
              label="Required tags"
              name="requiredTags"
              onChange={setRequiredTags}
              placeholder="brandaccount"
              prefix="@"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TagInput
              items={dos}
              label="Dos"
              name="dos"
              onChange={setDos}
              placeholder="Film inside the restaurant"
            />
            <TagInput
              items={donts}
              label="Don'ts"
              name="donts"
              onChange={setDonts}
              placeholder="No competitor comparisons"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-amber-950">
                Minimum video length
              </span>
              <select
                className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                name="minDurationSeconds"
                onChange={(event) => setMinDurationSeconds(event.target.value)}
                value={minDurationSeconds}
              >
                {durationOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="text-sm font-semibold text-amber-950">
                Allowed platforms
              </legend>
              <div className="mt-2 grid gap-2">
                {platformOptions.map((platform) => (
                  <label
                    className="flex items-center gap-3 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-950"
                    key={platform.value}
                  >
                    <input
                      className="h-4 w-4 accent-amber-600"
                      defaultChecked
                      name="allowedPlatforms"
                      type="checkbox"
                      value={platform.value}
                    />
                    {platform.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        <label className="block">
          <span className="text-sm font-semibold text-amber-950">
            Content instructions
          </span>
          <textarea
            className="mt-2 min-h-36 w-full resize-y rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            name="instructions"
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Dos and don'ts, hashtags, required shots, and things to avoid."
            required
            value={instructions}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-amber-950">
              Total budget
            </span>
            <input
              className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              min="1"
              name="totalBudget"
              onChange={(event) => setTotalBudget(event.target.value)}
              placeholder="5000"
              required
              step="0.01"
              type="number"
              value={totalBudget}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-amber-950">
              CPM rate
            </span>
            <input
              className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition placeholder:text-amber-900/35 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              min="0.01"
              name="cpmRate"
              onChange={(event) => setCpmRate(event.target.value)}
              placeholder="12"
              required
              step="0.01"
              type="number"
              value={cpmRate}
            />
            <span className="mt-2 block text-sm text-amber-900/70">
              At this rate, your budget covers approximately{" "}
              <strong className="font-semibold text-amber-950">
                {viewsFormatter.format(coveredViews)}
              </strong>{" "}
              views
            </span>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-amber-950">
            Campaign end date
          </span>
          <input
            className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-amber-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            min={minEndDate}
            name="expiresAt"
            onChange={(event) => setExpiresAt(event.target.value)}
            required
            type="date"
            value={expiresAt}
          />
          <span className="mt-2 block text-sm text-amber-900/70">
            Campaigns must run for at least 7 days.
          </span>
        </label>

        <button
          className="w-full rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
          type="submit"
        >
          Create active campaign
        </button>
      </form>

      <aside className="rounded-lg border border-amber-200 bg-[#fffaf0] p-5 lg:sticky lg:top-6 lg:self-start">
        <div className="border-b border-amber-200 pb-4">
          <h2 className="text-lg font-semibold text-amber-950">
            {title || "Campaign title"}
          </h2>
          <p className="mt-2 text-sm text-amber-900/70">Status: active</p>
        </div>

        <div className="space-y-5 py-5">
          <div>
            <h3 className="text-sm font-semibold text-amber-950">Brief</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-950/75">
              {brief || "Your campaign summary will appear here as you type."}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-950">
              Guidelines
            </h3>
            <div className="mt-2 space-y-2 text-sm leading-6 text-amber-950/75">
              <PreviewLine label="Mentions" values={requiredMentions} />
              <PreviewLine label="Hashtags" values={requiredHashtags} />
              <PreviewLine label="Tags" values={requiredTags} />
              <PreviewLine label="Dos" values={dos} />
              <PreviewLine label="Don'ts" values={donts} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-amber-950">
              Instructions
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-950/75">
              {instructions ||
                "Additional dos, don'ts, hashtags, and required talking points will appear here."}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-amber-200 pt-4 text-sm">
          <div>
            <dt className="text-amber-900/65">Budget</dt>
            <dd className="mt-1 font-semibold text-amber-950">{budgetLabel}</dd>
          </div>
          <div>
            <dt className="text-amber-900/65">CPM</dt>
            <dd className="mt-1 font-semibold text-amber-950">{cpmLabel}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-amber-900/65">Estimated reach</dt>
            <dd className="mt-1 font-semibold text-amber-950">
              {viewsFormatter.format(coveredViews)} views
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-amber-900/65">Ends</dt>
            <dd className="mt-1 font-semibold text-amber-950">
              {formatPreviewDate(expiresAt)}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

function TagInput({
  items,
  label,
  name,
  onChange,
  placeholder,
  prefix,
}: {
  items: string[];
  label: string;
  name: string;
  onChange: (items: string[]) => void;
  placeholder: string;
  prefix?: "#" | "@";
}) {
  const [value, setValue] = useState("");

  function addItem() {
    const normalized = normalizeTag(value, prefix);

    if (!normalized || items.includes(normalized)) {
      setValue("");
      return;
    }

    onChange([...items, normalized]);
    setValue("");
  }

  function removeItem(item: string) {
    onChange(items.filter((existing) => existing !== item));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addItem();
    }
  }

  return (
    <label className="block">
      <span className="text-sm font-semibold text-amber-950">{label}</span>
      <div className="mt-2 rounded-md border border-amber-200 bg-white px-3 py-2 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              className="inline-flex items-center gap-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950"
              key={item}
            >
              {item}
              <button
                className="text-amber-900/70 hover:text-amber-950"
                onClick={() => removeItem(item)}
                type="button"
              >
                x
              </button>
              <input name={name} type="hidden" value={item} />
            </span>
          ))}
        </div>
        <input
          className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-amber-950 outline-none placeholder:text-amber-900/35"
          onBlur={addItem}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>
    </label>
  );
}

function PreviewLine({ label, values }: { label: string; values: string[] }) {
  return (
    <p>
      <span className="font-semibold">{label}:</span>{" "}
      {values.length ? values.join(", ") : "None added"}
    </p>
  );
}
