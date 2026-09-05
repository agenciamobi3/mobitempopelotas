/* eslint-disable */

// @ts-nocheck

// This file is generated from src/routes by scripts/generate-route-tree.mjs.
// It is committed so route discovery is available before build-time regeneration.

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AlertasRouteImport } from './routes/alertas'
import { Route as ApiAccountDeleteRouteImport } from './routes/api/account/delete'
import { Route as ApiAccountExportRouteImport } from './routes/api/account/export'
import { Route as ApiCronDataStatusRouteImport } from './routes/api/cron/data-status'
import { Route as ApiCronEmbrapaRouteImport } from './routes/api/cron/embrapa'
import { Route as ApiCronForecastAccuracyRouteImport } from './routes/api/cron/forecast-accuracy'
import { Route as ApiCronPushDailyRouteImport } from './routes/api/cron/push-daily'
import { Route as ApiCronWeatherSnapshotRouteImport } from './routes/api/cron/weather-snapshot'
import { Route as ApiDefesaCivilStationsRouteImport } from './routes/api/defesa-civil/stations'
import { Route as ApiInmetAlertsRouteImport } from './routes/api/inmet/alerts'
import { Route as ApiInmetGeadasRouteImport } from './routes/api/inmet/geadas'
import { Route as ApiPushBroadcastRouteImport } from './routes/api/push/broadcast'
import { Route as ApiPushConfigRouteImport } from './routes/api/push/config'
import { Route as ApiPushSubscriptionRouteImport } from './routes/api/push/subscription'
import { Route as ApiRedemetImageRouteImport } from './routes/api/redemet/image'
import { Route as ApiRedemetRadarRouteImport } from './routes/api/redemet/radar'
import { Route as ApiRedemetSatelliteRouteImport } from './routes/api/redemet/satellite'
import { Route as ApiRedemetStormsRouteImport } from './routes/api/redemet/storms'
import { Route as ApiRuntimeVersionRouteImport } from './routes/api/runtime-version'
import { Route as ApiWeatherEmbrapaRouteImport } from './routes/api/weather/embrapa'
import { Route as ApiWeatherHourlyPrecipitationRouteImport } from './routes/api/weather/hourly-precipitation'
import { Route as ApiWidgetsNivelLaranjalRouteImport } from './routes/api/widgets/nivel-laranjal'
import { Route as AuthCallbackRouteImport } from './routes/auth/callback'
import { Route as AuthSignoutRouteImport } from './routes/auth/signout'
import { Route as BlogRouteImport } from './routes/blog'
import { Route as BrandTempoPelotasHeaderRouteImport } from './routes/brand/tempo-pelotas-header'
import { Route as BrandTempoPelotasIconDotPngRouteImport } from './routes/brand/tempo-pelotas-icon[.]png'
import { Route as BrandTempoPelotasMaskableDotPngRouteImport } from './routes/brand/tempo-pelotas-maskable[.]png'
import { Route as CamerasAoVivoPelotasRouteImport } from './routes/cameras-ao-vivo-pelotas'
import { Route as ChuvaEmPelotasRouteImport } from './routes/chuva-em-pelotas'
import { Route as ClimaEmPelotasRouteImport } from './routes/clima-em-pelotas'
import { Route as ContaRouteImport } from './routes/conta'
import { Route as ContribuirRouteImport } from './routes/contribuir'
import { Route as EmbedNivelLaranjalRouteImport } from './routes/embed/nivel-laranjal'
import { Route as EmbedStatusTempoAgoraRouteImport } from './routes/embed/status-tempo-agora'
import { Route as EmbedWidgetRouteImport } from './routes/embed/widget'
import { Route as Enchente1941PelotasRouteImport } from './routes/enchente-1941-pelotas'
import { Route as Enchente2001PelotasRouteImport } from './routes/enchente-2001-pelotas'
import { Route as Enchente2015PelotasRouteImport } from './routes/enchente-2015-pelotas'
import { Route as Enchente2024PelotasLaranjalRouteImport } from './routes/enchente-2024-pelotas-laranjal'
import { Route as EntrarRouteImport } from './routes/entrar'
import { Route as EstacaoEmbrapaPelotasRouteImport } from './routes/estacao-embrapa-pelotas'
import { Route as FeedRouteImport } from './routes/feed'
import { Route as HistoricoClimaticoPelotasRouteImport } from './routes/historico-climatico-pelotas'
import { Route as MapaDeGeadasRioGrandeDoSulRouteImport } from './routes/mapa-de-geadas-rio-grande-do-sul'
import { Route as MeteogramaPelotasRouteImport } from './routes/meteograma-pelotas'
import { Route as MetodologiaRouteImport } from './routes/metodologia'
import { Route as MinhaContaRouteImport } from './routes/minha-conta'
import { Route as NivelDaLagoaDosPatosLaranjalRouteImport } from './routes/nivel-da-lagoa-dos-patos-laranjal'
import { Route as NivelDoGuaibaRouteImport } from './routes/nivel-do-guaiba'
import { Route as PainelRouteImport } from './routes/painel'
import { Route as PelotasDotJsonRouteImport } from './routes/pelotas[.]json'
import { Route as Previsao15DiasPelotasRouteImport } from './routes/previsao-15-dias-pelotas'
import { Route as Previsao7DiasPelotasRouteImport } from './routes/previsao-7-dias-pelotas'
import { Route as PrivacidadeEDadosRouteImport } from './routes/privacidade-e-dados'
import { Route as QuemSomosRouteImport } from './routes/quem-somos'
import { Route as RadarESatelitePelotasRouteImport } from './routes/radar-e-satelite-pelotas'
import { Route as RobotsDotTxtRouteImport } from './routes/robots[.]txt'
import { Route as SitemapDotXmlRouteImport } from './routes/sitemap[.]xml'
import { Route as SituacaoHidrologicaPelotasRouteImport } from './routes/situacao-hidrologica-pelotas'
import { Route as StatusDosDadosRouteImport } from './routes/status-dos-dados'
import { Route as TempoAmanhaPelotasRouteImport } from './routes/tempo-amanha-pelotas'
import { Route as TempoEmCitySlugRouteImport } from './routes/tempo-em/$citySlug'
import { Route as TempoHojePelotasRouteImport } from './routes/tempo-hoje-pelotas'
import { Route as TempoLaranjalPelotasRouteImport } from './routes/tempo-laranjal-pelotas'
import { Route as TempoNaRegiaoSulRsRouteImport } from './routes/tempo-na-regiao-sul-rs'
import { Route as VentoEmPelotasRouteImport } from './routes/vento-em-pelotas'
import { Route as WidgetsRouteImport } from './routes/widgets'
import { Route as WidgetsNivelLaranjalDotJsRouteImport } from './routes/widgets/nivel-laranjal[.]js'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AlertasRoute = AlertasRouteImport.update({ id: '/alertas', path: '/alertas', getParentRoute: () => rootRouteImport } as any)
const ApiAccountDeleteRoute = ApiAccountDeleteRouteImport.update({ id: '/api/account/delete', path: '/api/account/delete', getParentRoute: () => rootRouteImport } as any)
const ApiAccountExportRoute = ApiAccountExportRouteImport.update({ id: '/api/account/export', path: '/api/account/export', getParentRoute: () => rootRouteImport } as any)
const ApiCronDataStatusRoute = ApiCronDataStatusRouteImport.update({ id: '/api/cron/data-status', path: '/api/cron/data-status', getParentRoute: () => rootRouteImport } as any)
const ApiCronEmbrapaRoute = ApiCronEmbrapaRouteImport.update({ id: '/api/cron/embrapa', path: '/api/cron/embrapa', getParentRoute: () => rootRouteImport } as any)
const ApiCronForecastAccuracyRoute = ApiCronForecastAccuracyRouteImport.update({ id: '/api/cron/forecast-accuracy', path: '/api/cron/forecast-accuracy', getParentRoute: () => rootRouteImport } as any)
const ApiCronPushDailyRoute = ApiCronPushDailyRouteImport.update({ id: '/api/cron/push-daily', path: '/api/cron/push-daily', getParentRoute: () => rootRouteImport } as any)
const ApiCronWeatherSnapshotRoute = ApiCronWeatherSnapshotRouteImport.update({ id: '/api/cron/weather-snapshot', path: '/api/cron/weather-snapshot', getParentRoute: () => rootRouteImport } as any)
const ApiDefesaCivilStationsRoute = ApiDefesaCivilStationsRouteImport.update({ id: '/api/defesa-civil/stations', path: '/api/defesa-civil/stations', getParentRoute: () => rootRouteImport } as any)
const ApiInmetAlertsRoute = ApiInmetAlertsRouteImport.update({ id: '/api/inmet/alerts', path: '/api/inmet/alerts', getParentRoute: () => rootRouteImport } as any)
const ApiInmetGeadasRoute = ApiInmetGeadasRouteImport.update({ id: '/api/inmet/geadas', path: '/api/inmet/geadas', getParentRoute: () => rootRouteImport } as any)
const ApiPushBroadcastRoute = ApiPushBroadcastRouteImport.update({ id: '/api/push/broadcast', path: '/api/push/broadcast', getParentRoute: () => rootRouteImport } as any)
const ApiPushConfigRoute = ApiPushConfigRouteImport.update({ id: '/api/push/config', path: '/api/push/config', getParentRoute: () => rootRouteImport } as any)
const ApiPushSubscriptionRoute = ApiPushSubscriptionRouteImport.update({ id: '/api/push/subscription', path: '/api/push/subscription', getParentRoute: () => rootRouteImport } as any)
const ApiRedemetImageRoute = ApiRedemetImageRouteImport.update({ id: '/api/redemet/image', path: '/api/redemet/image', getParentRoute: () => rootRouteImport } as any)
const ApiRedemetRadarRoute = ApiRedemetRadarRouteImport.update({ id: '/api/redemet/radar', path: '/api/redemet/radar', getParentRoute: () => rootRouteImport } as any)
const ApiRedemetSatelliteRoute = ApiRedemetSatelliteRouteImport.update({ id: '/api/redemet/satellite', path: '/api/redemet/satellite', getParentRoute: () => rootRouteImport } as any)
const ApiRedemetStormsRoute = ApiRedemetStormsRouteImport.update({ id: '/api/redemet/storms', path: '/api/redemet/storms', getParentRoute: () => rootRouteImport } as any)
const ApiRuntimeVersionRoute = ApiRuntimeVersionRouteImport.update({ id: '/api/runtime-version', path: '/api/runtime-version', getParentRoute: () => rootRouteImport } as any)
const ApiWeatherEmbrapaRoute = ApiWeatherEmbrapaRouteImport.update({ id: '/api/weather/embrapa', path: '/api/weather/embrapa', getParentRoute: () => rootRouteImport } as any)
const ApiWeatherHourlyPrecipitationRoute = ApiWeatherHourlyPrecipitationRouteImport.update({ id: '/api/weather/hourly-precipitation', path: '/api/weather/hourly-precipitation', getParentRoute: () => rootRouteImport } as any)
const ApiWidgetsNivelLaranjalRoute = ApiWidgetsNivelLaranjalRouteImport.update({ id: '/api/widgets/nivel-laranjal', path: '/api/widgets/nivel-laranjal', getParentRoute: () => rootRouteImport } as any)
const AuthCallbackRoute = AuthCallbackRouteImport.update({ id: '/auth/callback', path: '/auth/callback', getParentRoute: () => rootRouteImport } as any)
const AuthSignoutRoute = AuthSignoutRouteImport.update({ id: '/auth/signout', path: '/auth/signout', getParentRoute: () => rootRouteImport } as any)
const BlogRoute = BlogRouteImport.update({ id: '/blog', path: '/blog', getParentRoute: () => rootRouteImport } as any)
const BrandTempoPelotasHeaderRoute = BrandTempoPelotasHeaderRouteImport.update({ id: '/brand/tempo-pelotas-header', path: '/brand/tempo-pelotas-header', getParentRoute: () => rootRouteImport } as any)
const BrandTempoPelotasIconDotPngRoute = BrandTempoPelotasIconDotPngRouteImport.update({ id: '/brand/tempo-pelotas-icon.png', path: '/brand/tempo-pelotas-icon.png', getParentRoute: () => rootRouteImport } as any)
const BrandTempoPelotasMaskableDotPngRoute = BrandTempoPelotasMaskableDotPngRouteImport.update({ id: '/brand/tempo-pelotas-maskable.png', path: '/brand/tempo-pelotas-maskable.png', getParentRoute: () => rootRouteImport } as any)
const CamerasAoVivoPelotasRoute = CamerasAoVivoPelotasRouteImport.update({ id: '/cameras-ao-vivo-pelotas', path: '/cameras-ao-vivo-pelotas', getParentRoute: () => rootRouteImport } as any)
const ChuvaEmPelotasRoute = ChuvaEmPelotasRouteImport.update({ id: '/chuva-em-pelotas', path: '/chuva-em-pelotas', getParentRoute: () => rootRouteImport } as any)
const ClimaEmPelotasRoute = ClimaEmPelotasRouteImport.update({ id: '/clima-em-pelotas', path: '/clima-em-pelotas', getParentRoute: () => rootRouteImport } as any)
const ContaRoute = ContaRouteImport.update({ id: '/conta', path: '/conta', getParentRoute: () => rootRouteImport } as any)
const ContribuirRoute = ContribuirRouteImport.update({ id: '/contribuir', path: '/contribuir', getParentRoute: () => rootRouteImport } as any)
const EmbedNivelLaranjalRoute = EmbedNivelLaranjalRouteImport.update({ id: '/embed/nivel-laranjal', path: '/embed/nivel-laranjal', getParentRoute: () => rootRouteImport } as any)
const EmbedStatusTempoAgoraRoute = EmbedStatusTempoAgoraRouteImport.update({ id: '/embed/status-tempo-agora', path: '/embed/status-tempo-agora', getParentRoute: () => rootRouteImport } as any)
const EmbedWidgetRoute = EmbedWidgetRouteImport.update({ id: '/embed/widget', path: '/embed/widget', getParentRoute: () => rootRouteImport } as any)
const Enchente1941PelotasRoute = Enchente1941PelotasRouteImport.update({ id: '/enchente-1941-pelotas', path: '/enchente-1941-pelotas', getParentRoute: () => rootRouteImport } as any)
const Enchente2001PelotasRoute = Enchente2001PelotasRouteImport.update({ id: '/enchente-2001-pelotas', path: '/enchente-2001-pelotas', getParentRoute: () => rootRouteImport } as any)
const Enchente2015PelotasRoute = Enchente2015PelotasRouteImport.update({ id: '/enchente-2015-pelotas', path: '/enchente-2015-pelotas', getParentRoute: () => rootRouteImport } as any)
const Enchente2024PelotasLaranjalRoute = Enchente2024PelotasLaranjalRouteImport.update({ id: '/enchente-2024-pelotas-laranjal', path: '/enchente-2024-pelotas-laranjal', getParentRoute: () => rootRouteImport } as any)
const EntrarRoute = EntrarRouteImport.update({ id: '/entrar', path: '/entrar', getParentRoute: () => rootRouteImport } as any)
const EstacaoEmbrapaPelotasRoute = EstacaoEmbrapaPelotasRouteImport.update({ id: '/estacao-embrapa-pelotas', path: '/estacao-embrapa-pelotas', getParentRoute: () => rootRouteImport } as any)
const FeedRoute = FeedRouteImport.update({ id: '/feed', path: '/feed', getParentRoute: () => rootRouteImport } as any)
const HistoricoClimaticoPelotasRoute = HistoricoClimaticoPelotasRouteImport.update({ id: '/historico-climatico-pelotas', path: '/historico-climatico-pelotas', getParentRoute: () => rootRouteImport } as any)
const MapaDeGeadasRioGrandeDoSulRoute = MapaDeGeadasRioGrandeDoSulRouteImport.update({ id: '/mapa-de-geadas-rio-grande-do-sul', path: '/mapa-de-geadas-rio-grande-do-sul', getParentRoute: () => rootRouteImport } as any)
const MeteogramaPelotasRoute = MeteogramaPelotasRouteImport.update({ id: '/meteograma-pelotas', path: '/meteograma-pelotas', getParentRoute: () => rootRouteImport } as any)
const MetodologiaRoute = MetodologiaRouteImport.update({ id: '/metodologia', path: '/metodologia', getParentRoute: () => rootRouteImport } as any)
const MinhaContaRoute = MinhaContaRouteImport.update({ id: '/minha-conta', path: '/minha-conta', getParentRoute: () => rootRouteImport } as any)
const NivelDaLagoaDosPatosLaranjalRoute = NivelDaLagoaDosPatosLaranjalRouteImport.update({ id: '/nivel-da-lagoa-dos-patos-laranjal', path: '/nivel-da-lagoa-dos-patos-laranjal', getParentRoute: () => rootRouteImport } as any)
const NivelDoGuaibaRoute = NivelDoGuaibaRouteImport.update({ id: '/nivel-do-guaiba', path: '/nivel-do-guaiba', getParentRoute: () => rootRouteImport } as any)
const PainelRoute = PainelRouteImport.update({ id: '/painel', path: '/painel', getParentRoute: () => rootRouteImport } as any)
const PelotasDotJsonRoute = PelotasDotJsonRouteImport.update({ id: '/pelotas.json', path: '/pelotas.json', getParentRoute: () => rootRouteImport } as any)
const Previsao15DiasPelotasRoute = Previsao15DiasPelotasRouteImport.update({ id: '/previsao-15-dias-pelotas', path: '/previsao-15-dias-pelotas', getParentRoute: () => rootRouteImport } as any)
const Previsao7DiasPelotasRoute = Previsao7DiasPelotasRouteImport.update({ id: '/previsao-7-dias-pelotas', path: '/previsao-7-dias-pelotas', getParentRoute: () => rootRouteImport } as any)
const PrivacidadeEDadosRoute = PrivacidadeEDadosRouteImport.update({ id: '/privacidade-e-dados', path: '/privacidade-e-dados', getParentRoute: () => rootRouteImport } as any)
const QuemSomosRoute = QuemSomosRouteImport.update({ id: '/quem-somos', path: '/quem-somos', getParentRoute: () => rootRouteImport } as any)
const RadarESatelitePelotasRoute = RadarESatelitePelotasRouteImport.update({ id: '/radar-e-satelite-pelotas', path: '/radar-e-satelite-pelotas', getParentRoute: () => rootRouteImport } as any)
const RobotsDotTxtRoute = RobotsDotTxtRouteImport.update({ id: '/robots.txt', path: '/robots.txt', getParentRoute: () => rootRouteImport } as any)
const SitemapDotXmlRoute = SitemapDotXmlRouteImport.update({ id: '/sitemap.xml', path: '/sitemap.xml', getParentRoute: () => rootRouteImport } as any)
const SituacaoHidrologicaPelotasRoute = SituacaoHidrologicaPelotasRouteImport.update({ id: '/situacao-hidrologica-pelotas', path: '/situacao-hidrologica-pelotas', getParentRoute: () => rootRouteImport } as any)
const StatusDosDadosRoute = StatusDosDadosRouteImport.update({ id: '/status-dos-dados', path: '/status-dos-dados', getParentRoute: () => rootRouteImport } as any)
const TempoAmanhaPelotasRoute = TempoAmanhaPelotasRouteImport.update({ id: '/tempo-amanha-pelotas', path: '/tempo-amanha-pelotas', getParentRoute: () => rootRouteImport } as any)
const TempoEmCitySlugRoute = TempoEmCitySlugRouteImport.update({ id: '/tempo-em/$citySlug', path: '/tempo-em/$citySlug', getParentRoute: () => rootRouteImport } as any)
const TempoHojePelotasRoute = TempoHojePelotasRouteImport.update({ id: '/tempo-hoje-pelotas', path: '/tempo-hoje-pelotas', getParentRoute: () => rootRouteImport } as any)
const TempoLaranjalPelotasRoute = TempoLaranjalPelotasRouteImport.update({ id: '/tempo-laranjal-pelotas', path: '/tempo-laranjal-pelotas', getParentRoute: () => rootRouteImport } as any)
const TempoNaRegiaoSulRsRoute = TempoNaRegiaoSulRsRouteImport.update({ id: '/tempo-na-regiao-sul-rs', path: '/tempo-na-regiao-sul-rs', getParentRoute: () => rootRouteImport } as any)
const VentoEmPelotasRoute = VentoEmPelotasRouteImport.update({ id: '/vento-em-pelotas', path: '/vento-em-pelotas', getParentRoute: () => rootRouteImport } as any)
const WidgetsRoute = WidgetsRouteImport.update({ id: '/widgets', path: '/widgets', getParentRoute: () => rootRouteImport } as any)
const WidgetsNivelLaranjalDotJsRoute = WidgetsNivelLaranjalDotJsRouteImport.update({ id: '/widgets/nivel-laranjal.js', path: '/widgets/nivel-laranjal.js', getParentRoute: () => rootRouteImport } as any)

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    [path: string]: any
  }
}

const rootRouteChildren = {
  IndexRoute,
  AlertasRoute,
  ApiAccountDeleteRoute,
  ApiAccountExportRoute,
  ApiCronDataStatusRoute,
  ApiCronEmbrapaRoute,
  ApiCronForecastAccuracyRoute,
  ApiCronPushDailyRoute,
  ApiCronWeatherSnapshotRoute,
  ApiDefesaCivilStationsRoute,
  ApiInmetAlertsRoute,
  ApiInmetGeadasRoute,
  ApiPushBroadcastRoute,
  ApiPushConfigRoute,
  ApiPushSubscriptionRoute,
  ApiRedemetImageRoute,
  ApiRedemetRadarRoute,
  ApiRedemetSatelliteRoute,
  ApiRedemetStormsRoute,
  ApiRuntimeVersionRoute,
  ApiWeatherEmbrapaRoute,
  ApiWeatherHourlyPrecipitationRoute,
  ApiWidgetsNivelLaranjalRoute,
  AuthCallbackRoute,
  AuthSignoutRoute,
  BlogRoute,
  BrandTempoPelotasHeaderRoute,
  BrandTempoPelotasIconDotPngRoute,
  BrandTempoPelotasMaskableDotPngRoute,
  CamerasAoVivoPelotasRoute,
  ChuvaEmPelotasRoute,
  ClimaEmPelotasRoute,
  ContaRoute,
  ContribuirRoute,
  EmbedNivelLaranjalRoute,
  EmbedStatusTempoAgoraRoute,
  EmbedWidgetRoute,
  Enchente1941PelotasRoute,
  Enchente2001PelotasRoute,
  Enchente2015PelotasRoute,
  Enchente2024PelotasLaranjalRoute,
  EntrarRoute,
  EstacaoEmbrapaPelotasRoute,
  FeedRoute,
  HistoricoClimaticoPelotasRoute,
  MapaDeGeadasRioGrandeDoSulRoute,
  MeteogramaPelotasRoute,
  MetodologiaRoute,
  MinhaContaRoute,
  NivelDaLagoaDosPatosLaranjalRoute,
  NivelDoGuaibaRoute,
  PainelRoute,
  PelotasDotJsonRoute,
  Previsao15DiasPelotasRoute,
  Previsao7DiasPelotasRoute,
  PrivacidadeEDadosRoute,
  QuemSomosRoute,
  RadarESatelitePelotasRoute,
  RobotsDotTxtRoute,
  SitemapDotXmlRoute,
  SituacaoHidrologicaPelotasRoute,
  StatusDosDadosRoute,
  TempoAmanhaPelotasRoute,
  TempoEmCitySlugRoute,
  TempoHojePelotasRoute,
  TempoLaranjalPelotasRoute,
  TempoNaRegiaoSulRsRoute,
  VentoEmPelotasRoute,
  WidgetsRoute,
  WidgetsNivelLaranjalDotJsRoute,
}

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)
