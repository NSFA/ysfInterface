export default async(ctx, next) => {
    await ctx.render('index', {})
}
