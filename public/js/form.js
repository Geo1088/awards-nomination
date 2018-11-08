/* globals Vue, fetch */

// Returns true if the first string is roughly included in the second string.
function fuzzyMatch (typing, target) {
	return target != undefined && target.toLowerCase().includes(typing.toLowerCase());
}

// Returns true if a string is a partial match for at least one member of an array.
function stringMatchesArray (str, arr) {
	return arr.some(val => fuzzyMatch(str, val));
}

Vue.component('show-list', {
	model: {
		prop: 'selections',
		event: 'change'
	},
	props: ['shows', 'options', 'filterText', 'showAll'],
	data () {
		return {
			selections: {}
		};
	},
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
		<ul class="show-list">
			<li class="media show" v-for="show in filteredShows" :key="show.id">
				<div class="media-left">
					<img :src="show.img" :alt="show.terms[0]">
				</div>
				<div class="media-right" style="flex-grow: 1;">
					<p class="show-title">
						<h3 class="title is-size-3">{{show.terms[0]}}</h3>
						<p class="subtitle is-size-6" v-html="infoline(show)"></p>
					</p>
					<div class="options tabs is-toggle">
						<ul>
							<li v-for="option in options" :class="{'is-active': selections[show.id] === option}">
								<a @click="selectThing(show.id, option)">{{option}}</a>
							</li>
						</ul>
					</div>
				</div>
			</li>
			<li class="media" v-if="moreItems">
				<p class="has-text-centered" style="flex: 1 1 100%">
					And <b>{{moreItems}}</b> more (<a @click="$root.showAllShows = true">Show all</a>)
				</p>
			</li>
		</ul>
	`
});

Vue.component('character-list', {
	model: {
		prop: 'selections',
		event: 'change'
	},
	props: ['characters', 'filterText', 'options', 'showAll'],
	data () {
		return {
			selections: {}
		};
	},
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
		shownames (character) {
			return character.show_ids.map(id => `<a href="https://anilist.co/anime/${id}" target="_blank"><i>${this.$root.shows.find(s => s.id === id).terms[0].replace(/&/g, '&amp;').replace(/</g, '&lt;')}</i></a>`)
		}
	},
	template: `
		<ul class="character-list">
			<li class="media character" v-for="character in filteredCharacters" :key="character.id">
				<div class="media-left">
					<img :src="character.img" :alt="character.terms[0]">
				</div>
				<div class="media-right">
					<p class="character-name">
						<h3 class="title is-size-3">{{character.terms[0]}}</h3>
						<p class="subtitle is-size-6" v-html="infoline(character)"></p>
					</p>
					<div class="options">
						<label v-for="option in options">
							<input type="radio" :value="option" v-model="selections[character.id]" @change="$emit('change', selections)">
							<span class="option-text">{{option}}</span>
						</label>
					</div>
				</div>
			</li>
			<li class="media" v-if="moreItems">
				<p class="has-text-centered" style="flex: 1 1 100%">
					And <b>{{moreItems}}</b> more (<a @click="$root.showAllCharacters = true">Show all</a>)
				</p>
			</li>
		</ul>
	`
});

const app = new Vue({
	el: '#app',
	data: {
		characters: [],
		shows: [],
		characterFilter: '',
		showFilter: '',
		characterSelections: {},
		showSelections: {},
		showAllCharacters: false,
		showAllShows: false
	},
	template: `
		<div class="app">
			<section class="section" id="shows">
				<div class="container">
					<div class="level">
						<div class="level-left">
							<div class="intro">
								<h2 class="is-size-2 is-size-3-mobile">Shows</h2>
								<p>Find the shows you enjoyed the most and pick the category they fit best.</p>
							</div>
						</div>
						<div class="level-right">
							<div class="field is-grouped">
								<p class="control">
									<button :class="{button: true, 'is-link': showAllShows}" @click="showAllShows = !showAllShows">Show{{showAllShows ? 'ing' : ''}} All</button>
								</p>
								<p class="control">
									<input class="input" type="text" placeholder="Find a show..." v-model="showFilter">
								</p>
							</div>
						</div>
					</div>
					<div class="card">
						<show-list
							:shows="shows"
							:options="[
								'Action',
								'Adventure',
								'Comedy',
								'Drama',
								'Romance',
								'Slice of Life',
								'Thriller/Mystery'
							]"
							:filterText="showFilter"
							:showAll="showAllShows"
							v-model="showSelections"
						/>
					</div>
				</div>
			</section>
			<section class="section" id="characters">
				<div class="container">
					<div class="level">
						<div class="level-left">
							<div class="intro">
								<h2 class="is-size-2 is-size-3-mobile">Characters</h2>
								<p>Find the characters you liked the most and select whether you think they were main or supporting.</p>
							</div>
						</div>
						<div class="level-right">
							<div class="field is-grouped">
								<p class="control">
									<button :class="{button: true, 'is-link': showAllCharacters}" @click="showAllCharacters = !showAllCharacters">Show{{showAllCharacters ? 'ing' : ''}} All</button>
								</p>
								<p>
									<input class="input" type="text" placeholder="Find a character..." v-model="characterFilter">
								</p>
							</div>
						</div>
					</div>
					<div class="card">
						<character-list
							:characters="characters"
							:filterText="characterFilter"
							:options="[
								'Main',
								'Supporting'
							]"
							v-model="characterSelections"
							:showAll="showAllCharacters"
						/>
					</div>
				</div>
			</section>
		</div>
	`
});

fetch('/data/test.json').then(res => {
	console.log(res);
	return res.json();
}).then(({characters, shows}) => {
	console.log(characters, shows);
	app.characters = characters.sort((a, b) => a.terms[0].localeCompare(b.terms[0]));
	app.shows = shows.sort((a, b) => a.terms[0].localeCompare(b.terms[0]));
});
