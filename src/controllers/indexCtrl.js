/**
 * 返回同步数据，渲染页面模板
 * @param ctx
 * @param next
 * @returns {Promise.<void>}
 */
export default async(ctx, next) => {
    await ctx.render('index', {})
}
