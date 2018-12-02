require "yaml"
require "sinatra"
require "redd/middleware"
require "rethinkdb"
require "json-schema"

include RethinkDB::Shortcuts
c = r.connect db: 'aanoms_responses'

CONFIG = YAML.load_file "config.yaml"

use Rack::Session::Cookie
use Redd::Middleware, CONFIG.merge({
  user_agent: "web:github.com/Geo1088/awards-nomination:v1.0.0 (by /u/geo1088)",
  via: "/auth/reddit",
  redirect_uri: "#{CONFIG[:host]}/auth/reddit/callback",
  scope: ["identity"]
})

set :bind, "0.0.0.0"
set :port, ENV["PORT"] || 4567

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

  def authenticate!(sub: nil, host: false)
    redirect to "/" unless @r
    if host
      redirect to "/" unless HOSTS.include? @r.me.name
    end
    if sub
      # TODO
      redirect to "/" unless true
    end
  end
end

get "/" do
  redirect to "/form" if @r
  erb :index
end

# Auth stuff
get "/login" do redirect to "/auth/reddit" end
get "/auth/reddit/callback" do
  redirect to "/" unless request.env["redd.error"]
  erb :error, locals: {error: request.env["redd.error"]}
end
get "/logout" do
  request.env["redd.session"] = nil
  redirect to "/"
end

get "/public-nominations" do
  authenticate!
  erb :public_nominations
end

get "/hosts/genre-allocation" do
  # authenticate! host: true
  erb :genre_allocation
end

post "/response/:form" do |form|
  authenticate!
  halt 400, "Invalid Form" if !r.table_list().run(c).include? form
  begin
    body = JSON.parse(request.body.string, symbolize_names: true)
  rescue
    halt 400, "Invalid Body"
  end

  if r.table(form).get(@r.me.name).run(c)
    puts "existed"
    r.table(form).get(@r.me.name).update({
      selections: body[:selections]
    }).run(c)
  else
    puts "not existed"
    r.table(form).insert({
      id: @r.me.name,
      selections: body[:selections]
    }).run(c)
  end
  "Success"
end
