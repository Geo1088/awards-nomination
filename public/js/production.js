const data = JSON.parse(showsJSON).data || {};
const app = new Vue({
	el: '#app',
	data: {
		selectedTab: 'Art Style',
		shows: [],
		vas: [],
		filter: '',
		artSelections: data.art || {},
		animationSelections: data.animation || {},
		backgroundSelections: data.background || {},
		characterSelections: data.characters || {},
		cinemaSelections: data.cinema || {},
		ostSelections: data.ost || {},
		opSelections: data.op || {},
		edSelections: data.ed || {},
		vaSelections: data.va || {},
		showAll: false,
		saveButtonText: 'Save Selections',
		changesSinceSave: false,
	},
	computed: {
		currentSelections () {
			switch (this.selectedTab) {
				case 'Art Style': return 'artSelections';
				case 'Animation': return 'animationSelections';
				case 'Background Art': return 'backgroundSelections';
				case 'Character Design': return 'characterSelections';
				case 'Cinematography': return 'cinemaSelections';
				case "Original Soundtrack": return 'ostSelections';
				case 'OP': return 'opSelections';
				case 'ED': return 'edSelections';
				case 'Voice Acting': return 'vaSelections';
			}
		},
		currentSelectionsObj () {
			return this[this.currentSelections]
		},
		currentList () {
			switch (this.selectedTab) {
				case 'Voice Acting':
					return this.vas;
				default:
					return this.shows;
			}
		},
		_filteredShows () {
			return this.currentList.filter(show => stringMatchesArray(this.filter, show.terms))
				.filter(thing => {
					switch (this.selectedTab) {
						case 'Original Soundtrack':
						case 'Voice Acting':
							return true;
						default:
							return thing.format !== 'MOVIE'
					}
				});
		},
		filteredShows () {
			return this.showAll ? this._filteredShows : this._filteredShows.slice(0, 10);
		},
		moreItems () {
			return this._filteredShows.length - this.filteredShows.length;
		}
	},
	template: `
		<div class="app">
			<div class="hero is-dark">
				<div class="hero-body">
					<div class="container">
						<h2 class="title is-size-1 is-size-2-mobile">Production Awards</h2>
						<p class="subtitle is-size-4 is-size-5-mobile">Pick the shows from the year that excelled in various technical aspects.</p>
					</div>
				</div>
				<div class="hero-foot">
					<div class="container">
						<tab-bar
							:tabs="[
								'Art Style',
								'Animation',
								'Background Art',
								'Character Design',
								'Cinematography',
								'Original Soundtrack',
								'OP',
								'ED',
								'Voice Acting'
							]"
							v-model="selectedTab"
						/>
					</div>
				</div>
			</div>
			<section class="section" id="shows">
				<div class="container">
					<div class="level">
						<div class="level-left">
							<div class="intro">
								<h2 class="is-size-2 is-size-3-mobile">{{selectedTab}}</h2>
							</div>
						</div>
						<div class="level-right">
							<div class="field is-grouped">
								<p class="control">
									<button :class="{button: true, 'is-link': showAll}" @click="showAll = !showAll">
										Show{{showAll ? 'ing' : ''}} All
									</button>
								</p>
								<p class="control is-expanded">
									<input class="input" type="text" placeholder="Find a show..." v-model="filter">
								</p>
							</div>
						</div>
					</div>
					<div class="card media-list">
						<template v-if="selectedTab === 'Voice Acting'">
							<center>VA interface soon</center>
						</template>
						<template v-else-if="selectedTab === 'OP' || selectedTab === 'ED'">
							<center> OP/ED interface soon</center>
						</template>
						<template v-else>
							<show-display
								v-for="show in filteredShows"
								:key="show.id"
								:show="show"
								:checked="currentSelectionsObj[show.id]"
								@click.native="setThing(show.id)"
							/>
							<div class="more-items" v-if="moreItems">
								<p class="has-text-centered" style="flex: 1 1 100%">
									And <b>{{moreItems}}</b> more (<a @click="$root.showAll = true">Show all</a>)
								</p>
							</div>
						</template>
					</div>
				</div>
			</section>
			<div class="save-footer">
				<button class="button is-success save-button" @click="save">{{saveButtonText}}</button>
			</div>
		</div>
	`,
	watch: {
		selections: {
			handler () {
				this.changesSinceSave = true
			},
			deep: true
		},
	},
	methods: {
		setThing (id) {
			console.log('saa')
			Vue.set(this[this.currentSelections], id, !this.currentSelectionsObj[id]);
		},
		save () {
			this.saveButtonText = "Saving..."
			submit('/response/production', {
				data: {
					art: this.artSelections,
					animation: this.animationSelections,
					background: this.backgroundSelections,
					characters: this.characterSelections,
					cinema: this.cinemaSelections,
					ost: this.ostSelections,
					op: this.opSelections,
					ed: this.edSelections,
					va: this.vaSelections,
				}
			}).then(() => {
				this.changesSinceSave = false;
				this.saveButtonText = "Saved!"
				setTimeout(() => {
					this.saveButtonText = "Save Selections"
				}, 1500)
			}).catch(() => {
				this.saveButtonText = "Save Selections"
				alert('Failed to save, try again')
			});
		}
	}
});

window.onbeforeunload = function () {
	if (app.changesSinceSave) return "You have unsaved selections. Leave without saving?"
}

fetch('/data/test.json').then(res => {
	console.log(res);
	return res.json();
}).then(({shows, vas}) => {
	app.shows = shows.sort((a, b) => a.terms[0].replace(/^\s*|\s*$/g, '').localeCompare(b.terms[0].replace(/^\s*|\s*$/g, '')));
	app.vas = vas.sort((a, b) => a.name.replace(/^\s*|\s*$/g, '').localeCompare(b.name.replace(/^\s*|\s*$/g, '')));
});
