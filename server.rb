require "yaml"
require "sinatra"
require "redd/middleware"
require "rethinkdb"

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
    redirect to "/" if @r.me.created > CONFIG[:epoch]
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
  authenticate!
  halt 400, "Invalid Form" if !r.table_list().run(c).include? form
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
