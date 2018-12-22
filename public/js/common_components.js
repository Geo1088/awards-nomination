/* globals Vue, fetch */

// Returns true if the first string is roughly included in the second string.
function fuzzyMatch (typing, target) {
	return target != undefined && target.toLowerCase().includes(typing.toLowerCase());
}

// Returns true if a string is a partial match for at least one member of an array.
function stringMatchesArray (str, arr) {
	return arr.some(val => fuzzyMatch(str, val));
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
	},
	template: `
		<div :class="['media-item', {checked}]">
			<div class="cover" :style="\`background-image: url(\${show.img});\`">
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
				`<a href="https://anilist.co/anime/${this.show.id}" target="_blank">AniList</a>`
			].filter(s => s).join(" - ")
		},
		format () {
			switch (this.show.format) {
				case 'TV_SHORT': return 'TV Short'
				case 'MOVIE': return 'Movie'
				case 'SPECIAL': return 'Special'
				default: return this.show.format
			}
		},
	}
})

Vue.component('show-list', {
	model: {
		prop: 'selections',
		event: 'change'
	},
	props: [
		'shows',
		'options',
		'filterText',
		'showAll',
		'selections'
	],
	computed: {
		_filteredShows () {
			return this.shows.filter(show => stringMatchesArray(this.filterText, show.terms))
		},
		filteredShows () {
			return this.showAll ? this._filteredShows : this._filteredShows.slice(0, 10)
		},
		moreItems () {
			return this._filteredShows.length - this.filteredShows.length
		}
	},
	methods: {
		infoline (show) {
			return [
				this.format(show),
				`<a href="https://anilist.co/anime/${show.id}" target="_blank">AniList</a>`
			].filter(s => s).join(" - ")
		},
		selectThing (showId, option) {
			if (this.selections[showId] === option) {
				Vue.set(this.selections, showId, null)
			} else {
				Vue.set(this.selections, showId, option)
			}
			this.$emit('change', this.selections)
		},
		format (show) {
			switch (show.format) {
				case 'TV_SHORT': return 'TV Short'
				case 'MOVIE': return 'Movie'
				case 'SPECIAL': return 'Special'
				default: return show.format
			}
		}
	},
	template: `
		<div class="card show-list">
			<div class="show" v-for="show in filteredShows" :key="show.id">
				<div class="cover">
					<img :src="show.img" :alt="show.terms[0]">
				</div>
				<div class="info-selection" style="flex-grow: 1;">
					<div class="show-title">
						<h3 class="title is-size-3 is-size-5-mobile">{{show.terms[0]}}</h3>
						<p class="subtitle is-size-6" v-html="infoline(show)"></p>
					</div>
					<p class="options buttons has-addons is-hidden-touch">
						<a
							v-for="option in options"
							:class="{
								button: true,
								'is-primary': selections[show.id] && selections[show.id] === option
							}"
							@click="selectThing(show.id, option)"
						>
							{{option}}
						</a>
					</p>
					<p class="options select is-hidden-desktop">
						<select @change="selectChanged">
							<option :value="undefined"></option>
							<option v-for="option in options">
								{{option}}
							</option>
						</select>
					</p>
				</div>
			</div>
			<div class="more-items" v-if="moreItems">
				<p class="has-text-centered" style="flex: 1 1 100%">
					And <b>{{moreItems}}</b> more (<a @click="$root.showAll = true">Show all</a>)
				</p>
			</div>
		</div>
	`
});

// TODO
// so every character they vote for has to be assigned one of [comedic,
// dramatic] and one of [main, supporting], and optionally be marked as an
// antagonist


Vue.component('character-list', {
	model: {
		prop: 'selections',
		event: 'change'
	},
	props: [
		'characters',
		'filterText',
		'options',
		'showAll',
		'selections'
	],
	computed: {
		_filteredCharacters () {
			return this.characters.filter(char => stringMatchesArray(this.filterText, char.terms))
		},
		filteredCharacters () {
			return this.showAll ? this._filteredCharacters : this._filteredCharacters.slice(0, 20)
		},
		moreItems () {
			return this._filteredCharacters.length - this.filteredCharacters.length
		}
	},
	methods: {
		infoline (character) {
			return `From ${this.shownames(character).join(', ')}`
		},
		selectThing (showId, option) {
			if (this.selections[showId] === option) {
				Vue.set(this.selections, showId, null)
			} else {
				Vue.set(this.selections, showId, option)
			}
			this.$emit('change', this.selections)
		},
		toggle (characterId) {
			Vue.set(this.selections, characterId, !this.selections[characterId])
		},
		shownames (character) {
			return character.show_ids.map(id => `<a href="https://anilist.co/anime/${id}" target="_blank"><i>${this.$root.shows.find(s => s.id === id).terms[0].replace(/&/g, '&amp;').replace(/</g, '&lt;')}</i></a>`)
		}
	},
	template: `
		<div class="card character-list">
			<div class="character" v-for="character in filteredCharacters" :key="character.id">
				<div class="cover">
					<img :src="character.img" :alt="character.terms[0]">
					<a
						:class="[
							'button', 'cover-button',
							{'is-primary': selections[character.id]}
						]"
						@click="toggle(character.id)"
					>
						<span class="icon">
							<i class="far fa-square fa-lg" v-if="!selections[character.id]"></i>
							<i class="far fa-check-square fa-lg" v-if="selections[character.id]"></i>
						</span>
					</a>
				</div>
				<div class="info-selection">
					<div class="character-name">
						<h3 class="title is-size-3 is-size-5-mobile">{{character.terms[0]}}</h3>
						<p class="subtitle is-size-6" v-html="infoline(character)"></p>
					</div>
					<p class="options buttons has-addons is-hidden-touch">
						<a
							v-for="option in options"
							:class="{
								button: true,
								'is-primary': selections[character.id] === option
							}"
							@click="selectThing(character.id, option)"
							:disabled="!selections[character.id]"
						>
							{{option}}
						</a>
					</p>
					<p class="options is-hidden-desktop">
						Alternative things
					</p>
				</div>
			</div>
			<div class="more-items" v-if="moreItems">
				<p class="has-text-centered" style="flex: 1 1 100%">
					And <b>{{moreItems}}</b> more (<a @click="$root.showAllCharacters = true">Show all</a>)
				</p>
			</div>
		</div>
	`
});

function submit (url, data) {
	return fetch(url, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(data),
		credentials: 'include'
	})
}
