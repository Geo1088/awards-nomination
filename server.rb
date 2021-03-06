require "yaml"
require "sinatra"
require "redd/middleware"
require "rethinkdb"

include RethinkDB::Shortcuts
c = r.connect db: "aanoms_responses"

CONFIG = YAML.load_file "config.yaml"
HOSTS = CONFIG[:hosts]

JURORS = %w[
  FetchFrosh
  AmeCatsRune
  MrMonday11235
  tacticianjackk
  SIRTreehugger
  DoctorWhoops
  rusticks
  orange-shades
  Theleux
  Contrefacon
  LyfeBlades
  Cacophon
  Nickknight8
  chrispy294
  Combo33
  __Mekakucity
  Baker Mayfield
  MrGZJawesome
  ElDuwango
  Tigaisbae
  EpicTroll27
  ATargetFinderScrub
  RuSyxx
  thechosenapiks
  SpareUmbrella
  CadisRai
  kaverik
  Mozilla_Fennekin
  Vektor_
  rudygnuj
  sasalx
  jonlxh
  CoronelPanic
  hamptonwooster
  bconeill
  Zhebutler
  Blazehero
  Felistar
  elleyonce
  KokoroAkechi
  Chrngb
  iLoveAGoodIDea
  Maelstrommusic
  bagglewaggle
  HiggsBosonHL
  Vektor_
  NarneIsGood
  pewface123456789d
  Aztecopi
  XoNtheHAWK
  goncix
  Zelosis
  tiny_nipples
  13_Thieves
  Totalenlo
  BioChemRS
  Otoshigami69
  Master_of_Ares
  Princess_Tutu
  tombeet
  Miidas-92
  RingoFreakingStarr
  Cryzzalis
  kaixinsu
  clerikal
  TigerK3
  goncix
  HawkAussie
  Mage_of_Shadows
  NBVictory
  Scooll5
  oyooy
  llsmobius1
  jairefah
  bakuzan_
  EpicTroll27
  anarchycupcake
  DarkFuzz
  isrozzis
  Naattori44
  CT_BINO
  il42133
  alwayslonesome
  HumpingMantis
  xlolTenshi
  KokoroAkechi
  PwillyAlldilly
  XilentXenocide
  asi14
  BAmario
  Amajor2000
  Nyhuset
  beckwreck
  weejona
  BlubbyFluff
  otgesus
  77Mohammad77
  bornonamountaintop
  Escolyte
  theyummybagel
  chrispy294
  wheatsquares33
  Hades_Re
  JeffBallMap
  zhongzhen93
  Idesmi
  StoneFix
  bconeill
  Hyoizaburo
  valkeiser
  Tratini
  goukaryuu
  Schinco
  irvom
  Animestuck
  sfafreak
  faux_wizard
  SirPrize
  Fircoal
  gNat2
  Fred_MK
  Raging_SEAn
  SuperStarfox64
  keeptrackoftime
  Flegels
  cs098
  Raging_SEAn
  theultimate9
  Raging_SEAn
  Tipsly
  AfutureV
  nickknight8
  HidalgoAndThree
  RHINN0
  sacktheavenger
  PerfectPublican
  Snarfalopagus
  xxiLikeCatsxx
  33opo
  FrenziedHero
  brown_man_bob
  Schinco
  bconeill
  ATonOfBacon
  redshirtengineer
  mcadylons
  Win32error
  Deafnesss
  LegionWrex
  bananice
  geo1088
].map &:downcase

use Rack::Session::Cookie, secret: CONFIG[:cookie_secret]
use Redd::Middleware, CONFIG.merge({
  user_agent: "web:github.com/Geo1088/awards-nomination:v1.0.0 (by /u/geo1088)",
  via: "/auth/reddit",
  redirect_uri: "#{CONFIG[:host]}/auth/reddit/callback",
  scope: ["identity"]
})

set :bind, "0.0.0.0"
set :port, ENV["PORT"] || 4567
set :environment, CONFIG[:environment]

before do
  @r = request.env["redd.session"]
  begin
    @r.me.name
  rescue
    @r = nil
  end
end

helpers do
  def h(text)
    Rack::Utils.escape_html(text)
  end

  def authenticate!(host: false)
    redirect to "/" unless @r
    redirect to "/" if @r.me.created > CONFIG[:epoch]
    if host
      redirect to "/" unless HOSTS.include? @r.me.name
    end
  end
end

get "/" do
  erb :index
end

# Auth stuff
get "/login" do redirect to "/auth/reddit" end
get "/auth/reddit/callback" do
  redirect to "/" if request.env["redd.error"] == "access_denied"
  return erb :error, locals: {error: request.env["redd.error"]} if request.env["redd.error"]
  if @r.me.created > CONFIG[:epoch]
    request.env["redd.session"] = nil
    return erb :error, locals: {error: "Your account is too new!\nAccount created #{@r.me.created}"}
  end
  redirect to "/genres"
end
get "/logout" do
  request.env["redd.session"] = nil
  redirect to "/"
end

get %r{/(genres|characters|production|main)} do |route|
  authenticate!
  data = r.table(route).get(@r.me.name).run(c) || {}
  @route = route
  erb route.to_sym, locals: {
    data: data
  }
end

post "/response/:form" do |form|
  halt 400, "noms are over loser"
  authenticate!
  halt 400, "Invalid Form" if !r.table_list().run(c).include? form
  halt 400, "this is why we can't have nice things" if JURORS.include? @r.me.name.downcase
  begin
    data = JSON.parse(request.body.string)
  rescue
    halt 400, "Invalid Body"
  end

  if r.table(form).get(@r.me.name).run(c)
    puts "existed"
    r.table(form).get(@r.me.name).update(data).run(c)
  else
    puts "not existed"
    data["id"] = @r.me.name
    r.table(form).insert(data).run(c)
  end
  "Success"
end

get '/stats' do
  authenticate! host: true
  erb :stats, locals: {
    data: %w[genres characters production main].map {
      |category| [category, r.table(category).run(c).to_a]
    }.to_h
  }
end
