/* globals Vue, fetch */

// Returns true if the first string is roughly included in the second string.
function fuzzyMatch (typing, target) {
	return target != undefined && target.toLowerCase().includes(typing.toLowerCase());
}

// Returns true if a string is a partial match for at least one member of an array.
function stringMatchesArray (str, arr) {
	return arr.some(val => fuzzyMatch(str, val));
}

// https://stackoverflow.com/a/6274381/1070107
/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

Vue.component('tab-bar', {
	model: {
		prop: 'selectedTab',
		event: 'change'
	},
	props: {
		tabs: Array,
		selectedTab: String
	},
	template: `
		<div class="tabs is-boxed">
			<ul>
				<li
					v-for="tab in tabs"
					:key="tab"
					:class="{'is-active': tab === selectedTab}"
					@click="$emit('change', tab)"
				>
					<a>{{tab}}</a>
				</li>
			</ul>
		</div>
	`
})

Vue.component('show-display', {
	props: {
		show: Object,
		checked: Boolean,
		noHover: Boolean,
	},
	template: `
		<div :class="['media-item', {checked, 'no-hover': noHover}]">
			<div class="image" :style="\`background-image: url(\${show.img});\`">
				<span class="check fa-stack" v-if="checked">
					<i class="fas fa-square fa-stack-2x has-text-primary"/>
					<i class="fas fa-check fa-stack-1x has-text-white"/>
				</span>
			</div>
			<div class="info-selection" style="flex-grow: 1;">
				<div class="show-title">
					<h3 class="title is-size-3 is-size-5-mobile">{{show.terms[0]}}</h3>
					<p class="subtitle is-size-6" v-html="infoline"></p>
				</div>
				<slot/>
			</div>
		</div>
	`,
	computed: {
		infoline () {
			return [
				this.format,
				`<a href="https://anilist.co/anime/${this.show.id}" target="_blank" onclick="event.stopPropagation()">AniList</a>`,
				this.show.mal && `<a href="https://myanimelist.net/anime/${this.show.mal}" target="_blank" onclick="event.stopPropagation()">MyAnimeList</a>`,
			].filter(s => s).join(" - ")
		},
		format () {
			switch (this.show.format) {
				case 'TV_SHORT': return 'TV Short'
				case 'MOVIE': return 'Movie'
				case 'SPECIAL': return 'Special'
				case 'MUSIC': return 'Music Video'
				default: return this.show.format
			}
		},
	}
})

Vue.component('character-display', {
	props: {
		character: Object,
		checked: Boolean,
	},
	template: `
		<div :class="['media-item', {checked}]">
			<div class="image" :style="\`background-image: url(\${character.img});\`">
				<span class="check fa-stack" v-if="checked">
					<i class="fas fa-square fa-stack-2x has-text-primary"/>
					<i class="fas fa-check fa-stack-1x has-text-white"/>
				</span>
			</div>
			<div class="info-selection" style="flex-grow: 1;">
				<div class="character-name">
					<h3 class="title is-size-3 is-size-5-mobile">{{character.terms[0]}}</h3>
					<p class="subtitle is-size-6" v-html="infoline"></p>
				</div>
				<slot/>
			</div>
		</div>
	`,
	computed: {
		infoline () {
			return `From ${this.shownames.join(', ')}`
		},
		shownames () {
			return this.character.show_ids.map(id => {
				if (this.character.disableAnilist) return this.$root.shows.find(s => s.id === id).terms[0].replace(/&/g, '&amp;').replace(/</g, '&lt;');
				return `<a href="https://anilist.co/anime/${id}" target="_blank" onclick="event.stopPropagation()"><i>${this.$root.shows.find(s => s.id === id).terms[0].replace(/&/g, '&amp;').replace(/</g, '&lt;')}</i></a>`;
			})
		}
	}
})

Vue.component('va-display', {
	props: {
		va: Object,
		checked: Boolean,
	},
	template: `
	<div :class="['media-item', {checked}]">
		<div class="image" :style="\`background-image: url(\${character.img});\`">
			<span class="check fa-stack" v-if="checked">
				<i class="fas fa-square fa-stack-2x has-text-primary"/>
				<i class="fas fa-check fa-stack-1x has-text-white"/>
			</span>
		</div>
		<div class="info-selection" style="flex-grow: 1;">
			<div class="va-name">
				<h3 class="title is-size-3 is-size-5-mobile">{{va.name}}</h3>
				<p class="subtitle is-size-6" v-html="infoline"></p>
			</div>
			<slot/>
		</div>
	</div>
	`,
	computed: {
		character () {
			return this.$root.characters.find(c => c.id === this.va.character);
		},
		show () {
			return this.$root.shows.find(s => s.id === this.va.show)
		},
		infoline () {
			return `Voicing <a href="https://anilist.co/character/${this.character.id}" onclick="event.stopPropagation()">${this.character.terms[0]}</a> in <a href="https://anilist.co/anime/${this.show.id}" onclick="event.stopPropagation()">${this.show.terms[0]}</a>`
		},
	},
})

Vue.component('op-ed-chooser', {
	props: {
		selections: Array,
	},
	data () {
		return {
			things: this.selections,
		};
	},
	methods: {
		addNewThing () {
			if (this.things.some(thing => !thing.num)) return;
			this.things.push({type: 'op', num: ''});
			this.$emit('change', this.things);
		},
		thingUpdated () {
			this.$emit('change', this.things);
		},
		removeThing (index) {
			this.things.splice(index, 1);
			this.$emit('change', this.things);
		},
	},
	template: `
		<div class="op-ed-chooser">
			<div
				class="field has-addons"
				v-for="(selection, i) in things"
				:key="i"
			>
				<div class="control">
					<div class="select">
						<select v-model="selection.type">
							<option value="op">OP</option>
							<option value="ed">ED</option>
						</select>
					</div>
				</div>
				<div class="control">
					<input class="input" type="number" v-model="selection.num">
				</div>
				<div class="control">
					<button class="button is-danger" @click="removeThing(i)"><i class="fas fa-trash"/></button>
				</div>
			</div>
			<div class="buttons">
				<button
					class="button is-success"
					@click="addNewThing"
				>
					<i class="fas fa-plus"/>&nbsp; Add another
				</button>
			</div>
		</div>
	`,
})

function submit (url, data) {
	return fetch(url, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(data),
		credentials: 'include'
	})
}
