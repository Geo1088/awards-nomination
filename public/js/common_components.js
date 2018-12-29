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
				`<a href="https://anilist.co/anime/${this.show.id}" target="_blank" onclick="event.stopPropagation()">AniList</a>`
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
			return this.character.show_ids.map(id => `<a href="https://anilist.co/anime/${id}" target="_blank" onclick="event.stopPropagation()"><i>${this.$root.shows.find(s => s.id === id).terms[0].replace(/&/g, '&amp;').replace(/</g, '&lt;')}</i></a>`)
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
		<div class="image" :style="\`background-image: url(\${va.image});\`">
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
		infoline () {
			const character = this.$root.characters.find(c => c.id === this.va.character)
			const show = this.$root.shows.find(s => s.id === this.va.show)
			return `Voicing <a href="${character.id}" onclick="event.stopPropagation()">${character.terms[0]}</a> in <a href="https://anilist.co/anime/${show.id}" onclick="event.stopPropagation()">${show.terms[0]}</a>`
		},
	},
})

function submit (url, data) {
	return fetch(url, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(data),
		credentials: 'include'
	})
}
